# Bitespeed Identity Reconciliation Service

This repository contains a simple Node.js/Express service that implements the
`/identify` endpoint described in the Bitespeed backend task. It uses MySQL
via `mysql2/promise` and includes a minimal schema migration script.

## Getting started

hosted link https://bitespeed-identity-reconciliation-ikar.onrender.com/

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the database and table (PostgreSQL must be running and accessible):
   ```bash
   # if database doesn't exist you may need to create it manually:
   createdb -U postgres testdb
   npm run migrate
   # the migrate script uses psql; ensure it's on your PATH
   # adjust connection credentials in schema.sql or use environment variables
   ```

3. Start the server:
   ```bash
   npm start
   ```

   The service listens on `http://localhost:3000` by default.

## Endpoint

### `POST /identify`

Request body (JSON):
```json
{
  "email"?: "user@example.com",
  "phoneNumber"?: "1234567890"
}
```

Response body:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["a@b.com", "c@d.com"],
    "phoneNumbers": ["123", "456"],
    "secondaryContactIds": [2,3]
  }
}
```

The logic follows the task specification:

* Links contacts when email or phone matches.
* Oldest contact becomes primary; others are secondary.
* New contact data creates a secondary entry if at least one field is new.
* Primaries may be demoted when two primary chains merge.


## Example curl commands

```bash
# new contact
curl -X POST http://localhost:3000/identify -H 'Content-Type: application/json' -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'

# link existing contact
curl -X POST http://localhost:3000/identify -H 'Content-Type: application/json' -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'
```


## Notes

* Update the database credentials in `app.js` or use environment variables for
  production. When deploying on Render you can set `PGHOST`, `PGUSER`,
  `PGPASSWORD`, `PGDATABASE`, and `PGPORT` as environment secrets; the code
  currently uses hard‑coded values but you can replace `DB_CONFIG` entries with
  `process.env.*`.
* The `migrate` script assumes the `psql` CLI is installed and on your path.
* This is a minimal, in-memory-logic demonstration; for a production app you
  might want to move the reconciliation logic into stored procedures or a
  service layer with caching.

## Deployment (Render)

1. Push this repo to GitHub.
2. Create a new Web Service on Render, connect to the GitHub repo.
3. Set the build command to `npm install` and start command to `npm start`.
4. Add a FREE PostgreSQL instance via Render's dashboard; note the connection
   string and set the corresponding environment variables.
5. Run `npm run migrate` on the deployed instance (you can use a one-time
   command from Render's dashboard) to create the table.

Render's free tier gives a managed Postgres database and automatic builds from
GitHub, making it a good fit for this assignment.

