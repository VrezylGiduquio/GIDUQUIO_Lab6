import mysql from 'mysql2/promise';

import { env } from './env';
import { pool } from './db';

export async function initializeSchema() {
  const serverConnection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword
  });

  try {
    await serverConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.dbName}\``
    );
  } finally {
    await serverConnection.end();
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id CHAR(36) PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('Admin', 'User') NOT NULL DEFAULT 'User',
      verified_at DATETIME NULL,
      verification_token CHAR(36) NULL,
      reset_token CHAR(36) NULL,
      reset_token_expires_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id CHAR(36) PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      token CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      replaced_by_token CHAR(64) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);
}
