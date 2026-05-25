import dotenv from 'dotenv';

dotenv.config();

type SameSite = 'lax' | 'strict' | 'none';
type EmailDeliveryMode = 'preview' | 'emailjs' | 'auto';

const defaultCorsOrigin = 'http://localhost:4200,http://127.0.0.1:4200';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function booleanFromEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

function emailDeliveryModeFromEnv(): EmailDeliveryMode {
  const value = process.env.EMAIL_DELIVERY_MODE as EmailDeliveryMode | undefined;

  if (value === 'preview' || value === 'emailjs' || value === 'auto') {
    return value;
  }

  return (process.env.NODE_ENV ?? 'development') === 'production'
    ? 'emailjs'
    : 'preview';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? defaultCorsOrigin,
  corsOrigins: (process.env.CORS_ORIGIN ?? defaultCorsOrigin)
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  frontendBaseUrl: required(
    'FRONTEND_BASE_URL',
    process.env.CORS_ORIGIN ?? defaultCorsOrigin
  )
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)[0] ?? 'http://localhost:4200',
  dbHost: required('DB_HOST', '127.0.0.1'),
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbUser: required('DB_USER', 'root'),
  dbPassword: required('DB_PASSWORD', 'password'),
  dbName: required('DB_NAME', 'finalsdb'),
  jwtSecret: required('JWT_SECRET'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
  cookieName: process.env.COOKIE_NAME ?? 'refreshToken',
  cookieSecure: booleanFromEnv('COOKIE_SECURE', false),
  cookieSameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as SameSite,
  emailJsServiceId: process.env.EMAILJS_SERVICE_ID ?? process.env.VITE_EMAILJS_SERVICE_ID ?? '',
  emailJsTemplateId: process.env.EMAILJS_TEMPLATE_ID ?? process.env.VITE_EMAILJS_TEMPLATE_ID ?? '',
  emailJsVerificationTemplateId:
    process.env.EMAILJS_VERIFICATION_TEMPLATE_ID ??
    process.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID ??
    process.env.EMAILJS_TEMPLATE_ID ??
    process.env.VITE_EMAILJS_TEMPLATE_ID ??
    '',
  emailJsResetTemplateId:
    process.env.EMAILJS_RESET_TEMPLATE_ID ??
    process.env.EMAILJS_TEMPLATE_ID ??
    '',
  emailJsPublicKey: process.env.EMAILJS_PUBLIC_KEY ?? process.env.VITE_EMAILJS_PUBLIC_KEY ?? '',
  emailJsPrivateKey: process.env.EMAILJS_PRIVATE_KEY ?? process.env.VITE_EMAILJS_PRIVATE_KEY ?? '',
  emailDeliveryMode: emailDeliveryModeFromEnv(),
  emailAudienceName: process.env.EMAIL_AUDIENCE_NAME ?? 'Angular Auth Boilerplate'
};
