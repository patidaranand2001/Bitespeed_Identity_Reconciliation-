import pkg from 'pg';
const { Client } = pkg;

async function clearDb() {
  const conn = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Anand@2025',
    database: 'testdb',
    port: 5432,
  });
  await conn.connect();

  await conn.query('DROP TABLE IF EXISTS Contact');
  await conn.query(`
    CREATE TABLE Contact (
      id SERIAL PRIMARY KEY,
      phoneNumber VARCHAR(50),
      email VARCHAR(255),
      linkedId INT REFERENCES Contact(id) ON DELETE SET NULL,
      linkPrecedence VARCHAR(10) NOT NULL DEFAULT 'primary' CHECK (linkPrecedence IN ('primary','secondary')),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deletedAt TIMESTAMP NULL
    );
    CREATE INDEX IF NOT EXISTS idx_email ON Contact(email);
    CREATE INDEX IF NOT EXISTS idx_phone ON Contact(phoneNumber);
  `);
  console.log('✅ Database cleared and table recreated');
  await conn.end();
}

clearDb().catch(console.error);
