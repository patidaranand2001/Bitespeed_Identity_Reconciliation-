-- SQL schema for identity reconciliation task

-- Postgres schema for identity reconciliation

CREATE DATABASE testdb; -- manually create; or use CREATE DATABASE IF NOT EXISTS in newer PG
\c testdb

CREATE TABLE IF NOT EXISTS Contact (
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

