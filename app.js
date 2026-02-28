import express from 'express';
import mysql from 'mysql2/promise';

// configuration - adjust as needed or wire up environment variables
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Anand@2025',
  database: 'testdb',
  debug: false,
};

let db;

async function initDb() {
  db = await mysql.createConnection(DB_CONFIG);
  console.log('✅ Connected to MySQL');
  // create table if it doesn't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Contact (
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
}

function contactToResponse(primary, allContacts) {
  const emails = [...new Set(allContacts.filter(c => c.email).map(c => c.email))];
  const phones = [...new Set(allContacts.filter(c => c.phoneNumber).map(c => c.phoneNumber))];
  // put primary's values first
  emails.sort((a, b) => (a === primary.email ? -1 : b === primary.email ? 1 : 0));
  phones.sort((a, b) => (a === primary.phoneNumber ? -1 : b === primary.phoneNumber ? 1 : 0));
  const secondaryIds = allContacts.filter(c => c.id !== primary.id).map(c => c.id);

  return {
    contact: {
      primaryContactId: primary.id,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds,
    },
  };
}

async function gatherAllRelated(starting) {
  const related = new Map();
  const stack = [...starting];
  while (stack.length) {
    const contact = stack.pop();
    if (related.has(contact.id)) continue;
    related.set(contact.id, contact);
    // fetch parent if any
    if (contact.linkedId) {
      const [rows] = await db.query('SELECT * FROM Contact WHERE id = ?', [contact.linkedId]);
      if (rows.length) stack.push(rows[0]);
    }
    // fetch children
    const [children] = await db.query('SELECT * FROM Contact WHERE linkedId = ?', [contact.id]);
    for (const child of children) stack.push(child);
  }
  return Array.from(related.values());
}

async function identifyHandler(req, res) {
  const { email, phoneNumber } = req.body;
  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'email or phoneNumber required' });
  }

  // find contacts that match either value
  const conditions = [];
  const params = [];
  if (email) {
    conditions.push('email = ?');
    params.push(email);
  }
  if (phoneNumber) {
    conditions.push('phoneNumber = ?');
    params.push(phoneNumber);
  }
  const query = `SELECT * FROM Contact WHERE ${conditions.join(' OR ')}`;
  const [rows] = await db.query(query, params);

  if (rows.length === 0) {
    // no existing contact; create primary
    const [result] = await db.query('INSERT INTO Contact (email, phoneNumber) VALUES (?, ?)', [email || null, phoneNumber || null]);
    return res.json({
      contact: {
        primaryContactId: result.insertId,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      },
    });
  }

  // gather full related graph from all matching contacts
  let all = await gatherAllRelated(rows);

  // find all primary contacts in the graph
  const primaries = all.filter(c => c.linkPrecedence === 'primary');
  
  // determine the oldest primary
  const oldestPrimary = all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  let primary = primaries.length > 0 
    ? primaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]
    : oldestPrimary;

  // if there are multiple primaries, link all others to the oldest as secondary
  if (primaries.length > 1) {
    const oldestPrimID = primaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0].id;
    for (const p of primaries) {
      if (p.id !== oldestPrimID) {
        await db.query(
          'UPDATE Contact SET linkPrecedence = ?, linkedId = ? WHERE id = ?',
          ['secondary', oldestPrimID, p.id]
        );
      }
    }
    primary = primaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    
    // Re-fetch after updates
    all = await gatherAllRelated([primary]);
  }

  // check if we need to insert a new secondary
  const existingEmails = new Set(all.filter(c => c.email).map(c => c.email));
  const existingPhones = new Set(all.filter(c => c.phoneNumber).map(c => c.phoneNumber));
  
  if ((email && !existingEmails.has(email)) || (phoneNumber && !existingPhones.has(phoneNumber))) {
    await db.query(
      'INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence) VALUES (?, ?, ?, ?)',
      [email || null, phoneNumber || null, primary.id, 'secondary']
    );
    // Re-fetch the complete graph
    all = await gatherAllRelated([primary]);
  }

  res.json(contactToResponse(primary, all));
}

async function main() {
  await initDb();
  const app = express();
  app.use(express.json());
  
  // root endpoint with API instructions
  app.get('/', (req, res) => {
    res.json({
      message: 'Bitespeed Identity Reconciliation Service',
      endpoints: {
        POST: '/identify - Submit email and/or phoneNumber to identify contacts',
      },
      example: {
        url: 'POST http://localhost:3000/identify',
        body: { email: 'user@example.com', phoneNumber: '1234567890' },
      },
    });
  });
  
  app.post('/identify', identifyHandler);
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
  });
}

main().catch(err => {
  console.error('fatal', err);
  process.exit(1);
});