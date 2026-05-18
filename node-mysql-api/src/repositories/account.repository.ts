import { RowDataPacket } from 'mysql2';

import { pool } from '../config/db';
import { AccountRow } from '../types/account';

export async function countAccounts(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM accounts'
  );

  return Number(rows[0]?.total ?? 0);
}

export async function createAccount(input: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'User';
  verificationToken: string;
}) {
  await pool.execute(
    `INSERT INTO accounts (
      id,
      first_name,
      last_name,
      email,
      password_hash,
      role,
      verification_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.firstName,
      input.lastName,
      input.email.toLowerCase(),
      input.passwordHash,
      input.role,
      input.verificationToken
    ]
  );
}

export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  const [rows] = await pool.query<(AccountRow & RowDataPacket)[]>(
    'SELECT * FROM accounts WHERE email = ? LIMIT 1',
    [email.toLowerCase()]
  );

  return rows[0] ?? null;
}

export async function findAccountById(id: string): Promise<AccountRow | null> {
  const [rows] = await pool.query<(AccountRow & RowDataPacket)[]>(
    'SELECT * FROM accounts WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] ?? null;
}

export async function listAccounts(): Promise<AccountRow[]> {
  const [rows] = await pool.query<(AccountRow & RowDataPacket)[]>(
    'SELECT * FROM accounts ORDER BY created_at ASC'
  );

  return rows;
}

export async function findAccountByVerificationToken(token: string): Promise<AccountRow | null> {
  const [rows] = await pool.query<(AccountRow & RowDataPacket)[]>(
    'SELECT * FROM accounts WHERE verification_token = ? LIMIT 1',
    [token]
  );

  return rows[0] ?? null;
}

export async function markAccountVerified(id: string) {
  await pool.execute(
    `UPDATE accounts
     SET verified_at = NOW(), verification_token = NULL
     WHERE id = ?`,
    [id]
  );
}

export async function updateVerificationToken(accountId: string, token: string) {
  await pool.execute(
    `UPDATE accounts
     SET verification_token = ?, verified_at = NULL
     WHERE id = ?`,
    [token, accountId]
  );
}

export async function setResetToken(accountId: string, token: string, expiresAt: Date) {
  await pool.execute(
    `UPDATE accounts
     SET reset_token = ?, reset_token_expires_at = ?
     WHERE id = ?`,
    [token, expiresAt, accountId]
  );
}

export async function findAccountByResetToken(token: string): Promise<AccountRow | null> {
  const [rows] = await pool.query<(AccountRow & RowDataPacket)[]>(
    `SELECT * FROM accounts
     WHERE reset_token = ?
       AND reset_token_expires_at IS NOT NULL
       AND reset_token_expires_at > NOW()
     LIMIT 1`,
    [token]
  );

  return rows[0] ?? null;
}

export async function updatePassword(accountId: string, passwordHash: string) {
  await pool.execute(
    `UPDATE accounts
     SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL
     WHERE id = ?`,
    [passwordHash, accountId]
  );
}

export async function updateAccountProfile(input: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: 'Admin' | 'User';
}) {
  if (input.role) {
    await pool.execute(
      `UPDATE accounts
       SET first_name = ?, last_name = ?, email = ?, role = ?
       WHERE id = ?`,
      [input.firstName, input.lastName, input.email.toLowerCase(), input.role, input.id]
    );
    return;
  }

  await pool.execute(
    `UPDATE accounts
     SET first_name = ?, last_name = ?, email = ?
     WHERE id = ?`,
    [input.firstName, input.lastName, input.email.toLowerCase(), input.id]
  );
}

export async function deleteAccount(id: string) {
  await pool.execute('DELETE FROM accounts WHERE id = ?', [id]);
}
