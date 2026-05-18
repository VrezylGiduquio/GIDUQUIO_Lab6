import { Router } from 'express';

import { env } from '../config/env';
import { authorize } from '../middleware/auth.middleware';
import {
  authenticateAccount,
  changeAccountPassword,
  deleteAccountById,
  getAccountById,
  getAllAccounts,
  issuePasswordReset,
  refreshSession,
  registerAccount,
  resendVerificationEmail,
  resetAccountPassword,
  revokeSession,
  updateProfile,
  validatePasswordResetToken,
  verifyAccountEmail
} from '../services/account.service';
import {
  isRealEmailEnabled,
  sendPasswordResetEmail,
  sendVerificationEmail
} from '../services/email.service';
import { asyncHandler } from '../utils/async-handler';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from '../utils/cookies';
import { HttpError } from '../utils/http-error';

export const accountRouter = Router();

function buildDevEmailPreview(email: string, subject: string, actionUrl: string) {
  return {
    to: email,
    subject,
    body: `Open this link to continue: ${actionUrl}`,
    actionUrl
  };
}

function buildEmailResponse(email: string, subject: string, actionUrl: string) {
  if (isRealEmailEnabled()) {
    return undefined;
  }

  return buildDevEmailPreview(email, subject, actionUrl);
}

accountRouter.post('/register', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body as Record<string, string>;

  if (!firstName || !lastName || !email || !password) {
    throw new HttpError(400, 'All fields are required');
  }

  const result = await registerAccount({ firstName, lastName, email, password });
  const actionUrl = `${env.frontendBaseUrl}/verify-email?token=${result.verificationToken}`;

  await sendVerificationEmail(email, actionUrl);
  console.log(`Verify email link: ${actionUrl}`);

  res.status(201).json({
    message: result.message,
    devEmailPreview: buildEmailResponse(
      email,
      'Verify your account',
      actionUrl
    )
  });
}));

accountRouter.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body as Record<string, string>;

  if (!email) {
    throw new HttpError(400, 'Email is required');
  }

  const result = await resendVerificationEmail(email);

  if (!('verificationToken' in result)) {
    res.json({ message: result.message });
    return;
  }

  const actionUrl = `${env.frontendBaseUrl}/verify-email?token=${result.verificationToken}`;

  await sendVerificationEmail(email, actionUrl);
  console.log(`Verify email link: ${actionUrl}`);

  res.json({
    message: result.message,
    devEmailPreview: buildEmailResponse(
      email,
      'Verify your account',
      actionUrl
    )
  });
}));

accountRouter.post('/authenticate', asyncHandler(async (req, res) => {
  const { email, password } = req.body as Record<string, string>;

  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const { refreshToken, response } = await authenticateAccount(email, password);

  setRefreshTokenCookie(res, refreshToken);
  res.json(response);
}));

accountRouter.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body as Record<string, string>;

  if (!token) {
    throw new HttpError(400, 'Verification token is required');
  }

  await verifyAccountEmail(token);
  res.json({ message: 'Verification successful' });
}));

accountRouter.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body as Record<string, string>;

  if (!email) {
    throw new HttpError(400, 'Email is required');
  }

  const result = await issuePasswordReset(email);

  if (result.resetToken) {
    const actionUrl = `${env.frontendBaseUrl}/reset-password?token=${result.resetToken}`;

    await sendPasswordResetEmail(email, actionUrl);
    console.log(`Reset password link: ${actionUrl}`);

    res.json({
      message: result.message,
      devEmailPreview: buildEmailResponse(
        email,
        'Reset your password',
        actionUrl
      )
    });
    return;
  }

  res.json({ message: result.message });
}));

accountRouter.post('/validate-reset-token', asyncHandler(async (req, res) => {
  const { token } = req.body as Record<string, string>;

  if (!token) {
    throw new HttpError(400, 'Reset token is required');
  }

  await validatePasswordResetToken(token);
  res.json({ message: 'Token is valid' });
}));

accountRouter.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body as Record<string, string>;

  if (!token || !password || !confirmPassword) {
    throw new HttpError(400, 'Token, password and confirmPassword are required');
  }

  await resetAccountPassword({ token, password, confirmPassword });
  res.json({ message: 'Password reset successful' });
}));

accountRouter.post('/refresh-token', asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.[env.cookieName] as string | undefined;
  const { refreshToken, response } = await refreshSession(cookieToken);

  setRefreshTokenCookie(res, refreshToken);
  res.json(response);
}));

accountRouter.post('/revoke-token', asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.[env.cookieName] as string | undefined;

  await revokeSession(cookieToken);
  clearRefreshTokenCookie(res);

  res.json({ message: 'Token revoked' });
}));

accountRouter.get('/', authorize, asyncHandler(async (req, res) => {
  const actor = req.user;

  if (!actor) {
    throw new HttpError(401, 'Unauthorized');
  }

  const accounts = await getAllAccounts(actor.role);
  res.json(accounts);
}));

accountRouter.get('/:id', authorize, asyncHandler(async (req, res) => {
  const actor = req.user;

  if (!actor) {
    throw new HttpError(401, 'Unauthorized');
  }

  const account = await getAccountById({
    accountId: String(req.params.id),
    actorId: actor.sub,
    actorRole: actor.role
  });

  res.json(account);
}));

accountRouter.put('/:id', authorize, asyncHandler(async (req, res) => {
  const actor = req.user;

  if (!actor) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { firstName, lastName, email, role } = req.body as Record<string, string>;

  if (!firstName || !lastName || !email) {
    throw new HttpError(400, 'firstName, lastName and email are required');
  }

  const updated = await updateProfile({
    accountId: String(req.params.id),
    actorId: actor.sub,
    actorRole: actor.role,
    firstName,
    lastName,
    email,
    role: role === 'Admin' || role === 'User' ? role : undefined
  });

  res.json(updated);
}));

accountRouter.post('/:id/change-password', authorize, asyncHandler(async (req, res) => {
  const actor = req.user;

  if (!actor) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { currentPassword, newPassword, confirmPassword } =
    req.body as Record<string, string>;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new HttpError(
      400,
      'currentPassword, newPassword and confirmPassword are required'
    );
  }

  await changeAccountPassword({
    accountId: String(req.params.id),
    actorId: actor.sub,
    currentPassword,
    newPassword,
    confirmPassword
  });

  res.json({ message: 'Password updated successfully' });
}));

accountRouter.delete('/:id', authorize, asyncHandler(async (req, res) => {
  const actor = req.user;

  if (!actor) {
    throw new HttpError(401, 'Unauthorized');
  }

  await deleteAccountById({
    accountId: String(req.params.id),
    actorId: actor.sub,
    actorRole: actor.role
  });

  if (req.cookies?.[env.cookieName] && actor.sub === String(req.params.id)) {
    clearRefreshTokenCookie(res);
  }

  res.json({ message: 'Account deleted' });
}));
