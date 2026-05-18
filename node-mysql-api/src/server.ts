import { pool } from './config/db';
import { env } from './config/env';
import { initializeSchema } from './config/schema';
import { getEmailConfigurationIssue, isRealEmailEnabled } from './services/email.service';
import { app } from './app';

async function start() {
  await initializeSchema();
  await pool.query('SELECT 1');

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`API docs available at http://localhost:${env.port}/api-docs`);

    if (isRealEmailEnabled()) {
      console.log(`EmailJS delivery enabled with service ${env.emailJsServiceId}`);
      return;
    }

    console.warn(
      `EmailJS delivery disabled: ${getEmailConfigurationIssue() ?? 'configuration incomplete'}`
    );
    console.warn('The app will use the local email preview flow until EmailJS is configured.');
  });
}

void start().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
