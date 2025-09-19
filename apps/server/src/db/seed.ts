import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const main = async () => {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const existingUser = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      ['aluno@radegondes.com']
    );

    if (existingUser.rows.length > 0) {
      await client.query('DELETE FROM account WHERE "user_id" = $1', [existingUser.rows[0].id]);
      await client.query('DELETE FROM "user" WHERE id = $1', [existingUser.rows[0].id]);
    }

    const userId = crypto.randomUUID();
    const hashedPassword = "f2a911b03ba5e6dd60ba5269fc1c2a26:098d7c6c05cc6af9a9ac11ca8e337ef25bbabdf4682e5dddbc889f04c7d77e9a75c90076a5898927b7b39e0bba97d649c733a71e06e6b4aa5c05b0bba6f1e659";

    await client.query(
      'INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, 'Aluno Radegondes', 'aluno@radegondes.com', true, null, new Date(), new Date()]
    );

    await client.query(
      'INSERT INTO account (id, "account_id", "provider_id", "user_id", password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), userId, 'credential', userId, hashedPassword, new Date(), new Date()]
    );
  } catch (error) {
    // Silent fail
  } finally {
    await client.end();
  }
};

main();