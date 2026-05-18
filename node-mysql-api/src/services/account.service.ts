import crypto from 'crypto';

import {
  deleteAccount,
  countAccounts,
  createAccount,
  findAccountByEmail,
  findAccountById,
  findAccountByResetToken,
  findAccountByVerificationToken,
  listAccounts,
  markAccountVerified,
  setResetToken,
  updateVerificationToken,
  updateAccountProfile,
  updatePassword
} from '../repositories/account.repository';
import {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken
} from '../repositories/refresh-token.repository';
import { AuthPayload, PublicAccount } from '../types/account';
import { HttpError } from '../utils/http-error';
import { comparePassword, hashPassword } from '../utils/passwords';
import { generateAccessToken, generateOpaqueToken } from '../utils/tokens';
import { env } from '../config/env';

function toPublicAccount(account: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'User';
  verified_at: Date | null;
}): PublicAccount {
  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
    role: account.role,
    verified: Boolean(account.verified_at)
  };
}

async function buildAuthResponse(account: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'User';
  verified_at: Date | null;
}): Promise<{ refreshToken: string; response: AuthPayload }> {
  const refreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    id: crypto.randomUUID(),
    accountId: account.id,
    token: refreshToken,
    expiresAt
  });

  const publicAccount = toPublicAccount(account);

  return {
    refreshToken,
    response: {
      ...publicAccount,
      jwtToken: generateAccessToken({
        sub: publicAccount.id,
        email: publicAccount.email,
        role: publicAccount.role
      })
    }
  };
}

export async function registerAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const existing = await findAccountByEmail(input.email);

  if (existing) {
    throw new HttpError(400, 'Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const accountCount = await countAccounts();
  const verificationToken = crypto.randomUUID();

  await createAccount({
    id: crypto.randomUUID(),
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
    role: accountCount === 0 ? 'Admin' : 'User',
    verificationToken
  });

  return {
    message: 'Registration successful. Check your email for the verification link.',
    verificationToken
  };
}

export async function resendVerificationEmail(email: string) {
  const account = await findAccountByEmail(email);

  if (!account) {
    return { message: 'If the account exists, a verification link has been sent.' };
  }

  if (account.verified_at) {
    return { message: 'Account is already verified. You can sign in.' };
  }

  const verificationToken = crypto.randomUUID();

  await updateVerificationToken(account.id, verificationToken);

  return {
    message: 'Verification email resent successfully.',
    verificationToken
  };
}

export async function authenticateAccount(email: string, password: string) {
  const account = await findAccountByEmail(email);

  if (!account) {
    throw new HttpError(400, 'Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, account.password_hash);

  if (!isValidPassword) {
    throw new HttpError(400, 'Invalid email or password');
  }

  if (!account.verified_at) {
    throw new HttpError(400, 'Account not verified');
  }

  return buildAuthResponse(account);
}

export async function verifyAccountEmail(token: string) {
  const account = await findAccountByVerificationToken(token);

  if (!account) {
    throw new HttpError(400, 'Invalid verification token');
  }

  await markAccountVerified(account.id);
}

export async function issuePasswordReset(email: string) {
  const account = await findAccountByEmail(email);

  if (!account) {
    return { message: 'If the account exists, a reset link has been sent.' };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await setResetToken(account.id, token, expiresAt);

  return {
    message: 'If the account exists, a reset link has been sent.',
    resetToken: token
  };
}

export async function validatePasswordResetToken(token: string) {
  const account = await findAccountByResetToken(token);

  if (!account) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }
}

export async function resetAccountPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  if (input.password !== input.confirmPassword) {
    throw new HttpError(400, 'Passwords do not match');
  }

  const account = await findAccountByResetToken(input.token);

  if (!account) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(input.password);

  await updatePassword(account.id, passwordHash);
}

export async function refreshSession(token: string | undefined) {
  if (!token) {
    throw new HttpError(401, 'Refresh token is required');
  }

  const storedToken = await findRefreshToken(token);

  if (!storedToken || storedToken.revoked_at || storedToken.expires_at <= new Date()) {
    throw new HttpError(401, 'Invalid refresh token');
  }

  const account = await findAccountById(storedToken.account_id);

  if (!account) {
    throw new HttpError(401, 'Account not found');
  }

  const nextRefreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await revokeRefreshToken(token, nextRefreshToken);
  await createRefreshToken({
    id: crypto.randomUUID(),
    accountId: account.id,
    token: nextRefreshToken,
    expiresAt
  });

  const publicAccount = toPublicAccount(account);

  return {
    refreshToken: nextRefreshToken,
    response: {
      ...publicAccount,
      jwtToken: generateAccessToken({
        sub: publicAccount.id,
        email: publicAccount.email,
        role: publicAccount.role
      })
    }
  };
}

export async function revokeSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await revokeRefreshToken(token);
}

export async function updateProfile(input: {
  accountId: string;
  actorId: string;
  actorRole: 'Admin' | 'User';
  firstName: string;
  lastName: string;
  email: string;
  role?: 'Admin' | 'User';
}): Promise<AuthPayload> {
  if (input.actorRole !== 'Admin' && input.accountId !== input.actorId) {
    throw new HttpError(403, 'Forbidden');
  }

  const existing = await findAccountByEmail(input.email);

  if (existing && existing.id !== input.accountId) {
    throw new HttpError(400, 'Email is already registered');
  }

  await updateAccountProfile({
    id: input.accountId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    role: input.actorRole === 'Admin' ? input.role : undefined
  });

  const updated = await findAccountById(input.accountId);

  if (!updated) {
    throw new HttpError(404, 'Account not found');
  }

  const publicAccount = toPublicAccount(updated);

  return {
    ...publicAccount,
    jwtToken: generateAccessToken({
      sub: publicAccount.id,
      email: publicAccount.email,
      role: publicAccount.role
    })
  };
}

export async function changeAccountPassword(input: {
  accountId: string;
  actorId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  if (input.accountId !== input.actorId) {
    throw new HttpError(403, 'Forbidden');
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new HttpError(400, 'Passwords do not match');
  }

  const account = await findAccountById(input.accountId);

  if (!account) {
    throw new HttpError(404, 'Account not found');
  }

  const isValidPassword = await comparePassword(
    input.currentPassword,
    account.password_hash
  );

  if (!isValidPassword) {
    throw new HttpError(400, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await updatePassword(account.id, passwordHash);
}

export async function getAllAccounts(actorRole: 'Admin' | 'User') {
  if (actorRole !== 'Admin') {
    throw new HttpError(403, 'Forbidden');
  }

  const accounts = await listAccounts();
  return accounts.map(toPublicAccount);
}

export async function getAccountById(input: {
  accountId: string;
  actorId: string;
  actorRole: 'Admin' | 'User';
}) {
  if (input.actorRole !== 'Admin' && input.accountId !== input.actorId) {
    throw new HttpError(403, 'Forbidden');
  }

  const account = await findAccountById(input.accountId);

  if (!account) {
    throw new HttpError(404, 'Account not found');
  }

  return toPublicAccount(account);
}

export async function deleteAccountById(input: {
  accountId: string;
  actorId: string;
  actorRole: 'Admin' | 'User';
}) {
  if (input.actorRole !== 'Admin' && input.accountId !== input.actorId) {
    throw new HttpError(403, 'Forbidden');
  }

  const account = await findAccountById(input.accountId);

  if (!account) {
    throw new HttpError(404, 'Account not found');
  }

  await deleteAccount(input.accountId);
}
