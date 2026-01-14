# Dependencies to Install

Run this command to install the new dependencies required for email/password authentication:

```bash
npm install bcryptjs @types/bcryptjs
```

Then run the migration:

```bash
npm run migrate:deploy
```

Or manually apply the migration SQL from:
`prisma/migrations/20260114000000_add_password_and_email_verification/migration.sql`

