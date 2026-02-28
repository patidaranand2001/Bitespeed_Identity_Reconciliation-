import mysql from 'mysql2/promise';

async function clearDb() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Anand@2025',
    database: 'testdb',
  });
  
  await conn.query('DROP TABLE IF EXISTS Contact');
  await conn.query(`
    CREATE TABLE Contact (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phoneNumber VARCHAR(50),
      email VARCHAR(255),
      linkedId INT DEFAULT NULL,
      linkPrecedence ENUM('primary','secondary') NOT NULL DEFAULT 'primary',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deletedAt DATETIME NULL,
      INDEX idx_email (email),
      INDEX idx_phone (phoneNumber)
    )
  `);
  console.log('✅ Database cleared and table recreated');
  await conn.end();
}

clearDb().catch(console.error);
