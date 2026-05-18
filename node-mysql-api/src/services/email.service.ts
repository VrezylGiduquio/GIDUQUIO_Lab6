import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateId: string;
};

type EmailJsRequest = {
  service_id: string;
  template_id: string;
  user_id: string;
  accessToken?: string;
  template_params: Record<string, string>;
};

function isPlaceholder(value: string) {
  return value.startsWith('replace-with-') || value.startsWith('your_');
}

function canSendRealEmail() {
  return Boolean(
    env.emailJsServiceId &&
    env.emailJsVerificationTemplateId &&
    env.emailJsResetTemplateId &&
    env.emailJsPublicKey
  ) &&
  !isPlaceholder(env.emailJsServiceId) &&
  !isPlaceholder(env.emailJsVerificationTemplateId) &&
  !isPlaceholder(env.emailJsResetTemplateId) &&
  !isPlaceholder(env.emailJsPublicKey);
}

export function getEmailConfigurationIssue(): string | null {
  if (!env.emailJsServiceId) {
    return 'EMAILJS_SERVICE_ID is missing';
  }

  if (isPlaceholder(env.emailJsServiceId)) {
    return 'EMAILJS_SERVICE_ID still uses the placeholder value';
  }

  if (!env.emailJsVerificationTemplateId) {
    return 'EMAILJS_VERIFICATION_TEMPLATE_ID is missing';
  }

  if (isPlaceholder(env.emailJsVerificationTemplateId)) {
    return 'EMAILJS_VERIFICATION_TEMPLATE_ID still uses the placeholder value';
  }

  if (!env.emailJsResetTemplateId) {
    return 'EMAILJS_RESET_TEMPLATE_ID is missing';
  }

  if (isPlaceholder(env.emailJsResetTemplateId)) {
    return 'EMAILJS_RESET_TEMPLATE_ID still uses the placeholder value';
  }

  if (!env.emailJsPublicKey) {
    return 'EMAILJS_PUBLIC_KEY is missing';
  }

  if (isPlaceholder(env.emailJsPublicKey)) {
    return 'EMAILJS_PUBLIC_KEY still uses the placeholder value';
  }

  return null;
}

function buildTemplateParams(payload: EmailPayload) {
  return {
    to_email: payload.to,
    subject: payload.subject,
    action_url: extractFirstLink(payload.html) ?? '',
    message_html: payload.html,
    message_text: payload.text,
    audience_name: env.emailAudienceName
  };
}

function extractFirstLink(html: string) {
  const match = html.match(/href="([^"]+)"/i);
  return match?.[1] ?? null;
}

async function sendWithEmailJs(payload: EmailPayload) {
  if (!canSendRealEmail()) {
    return false;
  }

  const requestBody: EmailJsRequest = {
    service_id: env.emailJsServiceId,
    template_id: payload.templateId,
    user_id: env.emailJsPublicKey,
    template_params: buildTemplateParams(payload)
  };

  if (env.emailJsPrivateKey) {
    requestBody.accessToken = env.emailJsPrivateKey;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (response.ok) {
    return true;
  }

  const errorText = await response.text();

  throw new HttpError(
    502,
    `Unable to send email with EmailJS: ${errorText || response.statusText}`
  );
}

export function isRealEmailEnabled() {
  return canSendRealEmail();
}

export async function sendVerificationEmail(to: string, actionUrl: string) {
  return sendWithEmailJs({
    to,
    subject: 'Verify your account',
    templateId: env.emailJsVerificationTemplateId,
    html: `
      <h2>Verify your account</h2>
      <p>Click the link below to verify your account.</p>
      <p><a href="${actionUrl}">${actionUrl}</a></p>
    `,
    text: `Verify your account by opening this link: ${actionUrl}`
  });
}

export async function sendPasswordResetEmail(to: string, actionUrl: string) {
  return sendWithEmailJs({
    to,
    subject: 'Reset your password',
    templateId: env.emailJsResetTemplateId,
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password.</p>
      <p><a href="${actionUrl}">${actionUrl}</a></p>
    `,
    text: `Reset your password by opening this link: ${actionUrl}`
  });
}
