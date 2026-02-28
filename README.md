# Bitespeed_Identity_Reconciliation-
Bitespeed Backend Task: Identity Reconciliation 

# Bitespeed Identity Reconciliation Service

This repository contains a simple Node.js/Express service that implements the
`/identify` endpoint described in the Bitespeed backend task. It uses MySQL
via `mysql2/promise` and includes a minimal schema migration script.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the database and table:
   ```bash
   npm run migrate
   # you will be prompted for your MySQL root password
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
  production.
* The `migrate` script assumes the `mysql` CLI is installed and on your path.
* This is a minimal, in-memory-logic demonstration; for a production app you
  might want to move the reconciliation logic into stored procedures or a
  service layer with caching.
