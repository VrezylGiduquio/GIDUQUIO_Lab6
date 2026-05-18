import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { pool } from '../config/db';

export interface RefreshTokenRow {
  id: string;
  account_id: string;
  token: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_token: string | null;
}

export async function createRefreshToken(input: {
  id: string;
  accountId: string;
  token: string;
  expiresAt: Date;
}) {
  await pool.execute(
    `INSERT INTO refresh_tokens (id, account_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
    [input.id, input.accountId, input.token, input.expiresAt]
  );
}

export async function findRefreshToken(token: string): Promise<RefreshTokenRow | null> {
  const [rows] = await pool.query<(RefreshTokenRow & RowDataPacket)[]>(
    'SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1',
    [token]
  );

  return rows[0] ?? null;
}

export async function revokeRefreshToken(token: string, replacedByToken?: string) {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), replaced_by_token = ?
     WHERE token = ? AND revoked_at IS NULL`,
    [replacedByToken ?? null, token]
  );

  return result.affectedRows;
}
