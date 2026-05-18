export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Angular Auth Boilerplate API',
    version: '1.0.0',
    description: 'Node.js + MySQL backend for the Angular 21 authentication project.'
  },
  servers: [
    { url: 'http://localhost:4000' }
  ],
  tags: [
    { name: 'Health' },
    { name: 'Accounts' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy'
          }
        }
      }
    },
    '/accounts/register': {
      post: {
        tags: ['Accounts'],
        summary: 'Register a new account',
        responses: { '201': { description: 'Registered' } }
      }
    },
    '/accounts/resend-verification': {
      post: {
        tags: ['Accounts'],
        summary: 'Resend verification email',
        responses: { '200': { description: 'Verification resent' } }
      }
    },
    '/accounts/authenticate': {
      post: {
        tags: ['Accounts'],
        summary: 'Authenticate user',
        responses: { '200': { description: 'Authenticated' } }
      }
    },
    '/accounts/verify-email': {
      post: {
        tags: ['Accounts'],
        summary: 'Verify email token',
        responses: { '200': { description: 'Verified' } }
      }
    },
    '/accounts/forgot-password': {
      post: {
        tags: ['Accounts'],
        summary: 'Issue password reset email',
        responses: { '200': { description: 'Reset issued' } }
      }
    },
    '/accounts/validate-reset-token': {
      post: {
        tags: ['Accounts'],
        summary: 'Validate password reset token',
        responses: { '200': { description: 'Token valid' } }
      }
    },
    '/accounts/reset-password': {
      post: {
        tags: ['Accounts'],
        summary: 'Reset password',
        responses: { '200': { description: 'Password reset' } }
      }
    },
    '/accounts/refresh-token': {
      post: {
        tags: ['Accounts'],
        summary: 'Refresh session token',
        responses: { '200': { description: 'Session refreshed' } }
      }
    },
    '/accounts/revoke-token': {
      post: {
        tags: ['Accounts'],
        summary: 'Revoke refresh token',
        responses: { '200': { description: 'Token revoked' } }
      }
    },
    '/accounts': {
      get: {
        tags: ['Accounts'],
        summary: 'List all accounts',
        responses: { '200': { description: 'Accounts returned' } }
      }
    },
    '/accounts/{id}': {
      get: {
        tags: ['Accounts'],
        summary: 'Get account by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account returned' } }
      },
      put: {
        tags: ['Accounts'],
        summary: 'Update account',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account updated' } }
      },
      delete: {
        tags: ['Accounts'],
        summary: 'Delete account',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Account deleted' } }
      }
    },
    '/accounts/{id}/change-password': {
      post: {
        tags: ['Accounts'],
        summary: 'Change own password',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Password changed' } }
      }
    }
  }
};
