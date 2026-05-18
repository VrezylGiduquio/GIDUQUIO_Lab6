# Angular Auth Boilerplate Final Project

Full-stack authentication system using:
- Angular 21 frontend
- Node.js + Express backend
- MySQL database

This repository is wired to support both evaluation stages from the final project instructions:
- Stage A: Angular app with built-in fake backend
- Stage B: Angular app connected to the real Node.js + MySQL API

## Features

- Sign up with email verification
- Login with JWT auth
- Refresh token session flow
- Forgot password and reset password
- Role-based authorization with `Admin` and `User`
- Profile update, password change, and self-delete
- Admin account management
- Backend API docs at `/api-docs`

## Project Structure

- `src/`: Angular frontend
- `node-mysql-api/`: Node.js + MySQL backend

## Stage A: Fake Backend

The Angular app includes a built-in fake backend interceptor.

To enable it, edit:
- [environment.ts](/Users/jamardines/Desktop/GIDUQUIO_Lab6/src/environments/environment.ts:1)

Set:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:4000',
  useFakeBackend: true
};
```

Then run:

```bash
cd /Users/jamardines/Desktop/GIDUQUIO_Lab6
nvm use 22
npm start
```

Open:

```text
http://127.0.0.1:4200
```

Use Stage A to demonstrate:
- registration
- mock email alert / verification link
- login
- route guards
- admin access

To switch back to the real API, set `useFakeBackend: false`.

## Stage B: Real Backend Integration

### Backend Setup

Copy the backend env template:

```bash
cd /Users/jamardines/Desktop/GIDUQUIO_Lab6/node-mysql-api
cp .env.example .env
```

Update `.env` with your real values:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://127.0.0.1:4200,http://localhost:4200
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
COOKIE_NAME=refreshToken
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Your App <onboarding@resend.dev>
RESEND_AUDIENCE_NAME=Your App Users
```

Install dependencies and run the backend:

```bash
cd /Users/jamardines/Desktop/GIDUQUIO_Lab6/node-mysql-api
npm install
npm run dev
```

Useful routes:
- `http://localhost:4000/health`
- `http://localhost:4000/api-docs`

### Frontend Setup

The local frontend environment already points to:
- `http://127.0.0.1:4000`

Make sure fake backend is disabled in:
- [environment.ts](/Users/jamardines/Desktop/GIDUQUIO_Lab6/src/environments/environment.ts:1)

Run:

```bash
cd /Users/jamardines/Desktop/GIDUQUIO_Lab6
nvm use 22
npm install
npm start
```

Open:

```text
http://127.0.0.1:4200
```

## Production Configuration

Production API URL is configured in:
- [environment.prod.ts](/Users/jamardines/Desktop/GIDUQUIO_Lab6/src/environments/environment.prod.ts:1)

Build command:

```bash
ng build --configuration production
```

## SPA Rewrite Rule

For Render or similar static hosting, configure a rewrite rule:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

This is required so deep links like:
- `/verify-email?token=...`
- `/reset-password?token=...`

do not return `404`.

## Backend Deployment Checklist

- deploy the Node.js API publicly
- connect it to remote MySQL
- make `/api-docs` publicly reachable
- set `CORS_ORIGIN` to the deployed frontend URL
- configure email delivery for verification/reset emails

## Frontend Deployment Checklist

- deploy Angular as an SPA
- build with `ng build --configuration production`
- verify rewrite rule is active
- update `environment.prod.ts` to the deployed API URL

## Security Notes

- secrets must stay in `.env` or hosting platform environment variables
- `.env` is ignored by git
- do not hardcode JWT secrets or DB passwords in committed code

## Exam Verification Flow

Expected checks from the final instructions:

1. Register the first account and verify it becomes `Admin`
2. Register a second account and verify it becomes `User`
3. Verify email through the verification link
4. Log in and confirm protected routes work
5. Confirm `User` cannot access the admin panel
6. Confirm `Admin` can manage accounts
7. Confirm refresh token flow and login persistence
