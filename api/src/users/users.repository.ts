import { pool } from '../db';

export async function findNameById(id: number): Promise<string | null> {
  const { rows } = await pool.query('select name from users where id = $1', [id]);
  return rows[0]?.name ?? null;
}

export interface UserSummary {
  id: number;
  name: string;
}

export async function listUsers(): Promise<UserSummary[]> {
  const { rows } = await pool.query<{ id: number; name: string }>(
    'select id, name from users order by name asc'
  );
  return rows;
}
