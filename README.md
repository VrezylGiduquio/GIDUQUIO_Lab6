# Angular Auth Boilerplate Final Project

Full-stack authentication system using:
- Angular 21 frontend
- Node.js + Express backend
- MySQL database

## Project Structure

```text
GIDUQUIO_Lab6/
├─ frontend/          Angular application
├─ node-mysql-api/    Node.js + Express + MySQL API
├─ .vscode/           Workspace launch/tasks
├─ package.json       Root convenience scripts
└─ README.md
```

The frontend and backend are now separated into their own project folders. Each has its own `package.json`, dependencies, and build scripts.

## Root Commands

From the repository root:

```bash
npm run frontend
npm run backend
```

Useful root scripts:
- `npm run frontend`: start Angular on `http://127.0.0.1:4200`
- `npm run frontend:build`: build the Angular app
- `npm run frontend:test`: run frontend tests
- `npm run backend`: start the API in development mode
- `npm run backend:build`: compile the API
- `npm run backend:start`: run the compiled API

## Stage A: Fake Backend

The Angular app includes a built-in fake backend interceptor.

To enable it, edit:
- [environment.ts](/c:/Users/tange/Documents/GIDUQUIO_Lab6/frontend/src/environments/environment.ts:1)

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
cd frontend
npm install
npm start
```

Open:

```text
http://127.0.0.1:4200
```

To switch back to the real API, set `useFakeBackend: false`.

## Stage B: Real Backend Integration

### Backend Setup

Copy the backend env template:

```bash
cd node-mysql-api
copy .env.example .env
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
cd node-mysql-api
npm install
npm run dev
```

Useful routes:
- `http://localhost:4000/health`
- `http://localhost:4000/api-docs`

### Frontend Setup

The local frontend environment is configured in:
- [environment.ts](/c:/Users/tange/Documents/GIDUQUIO_Lab6/frontend/src/environments/environment.ts:1)

Run:

```bash
cd frontend
npm install
npm start
```

Open:

```text
http://127.0.0.1:4200
```

## Production Configuration

Production API URL is configured in:
- [environment.prod.ts](/c:/Users/tange/Documents/GIDUQUIO_Lab6/frontend/src/environments/environment.prod.ts:1)

Build command:

```bash
cd frontend
npm run build -- --configuration production
```

## SPA Rewrite Rule

For Render or similar static hosting, configure a rewrite rule:
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

This is required so deep links like `/verify-email?token=...` and `/reset-password?token=...` do not return `404`.

## Deployment Checklists

Backend:
- deploy the Node.js API publicly
- connect it to remote MySQL
- make `/api-docs` publicly reachable
- set `CORS_ORIGIN` to the deployed frontend URL
- configure email delivery for verification/reset emails

Frontend:
- deploy Angular as an SPA from `frontend/`
- build with `npm run build -- --configuration production`
- verify the rewrite rule is active
- update `environment.prod.ts` to the deployed API URL

## Security Notes

- secrets must stay in `.env` or hosting platform environment variables
- `.env` is ignored by git
- do not hardcode JWT secrets or DB passwords in committed code
