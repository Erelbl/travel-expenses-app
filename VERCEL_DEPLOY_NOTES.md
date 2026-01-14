# Vercel Deployment Notes

## Root Cause of Errors

### Error 1: Prisma P2022 "column does not exist"
**Problem**: The `passwordHash` column doesn't exist in the Neon database because migrations weren't applied.

**Solution**: 
- Updated `package.json` build script to run `prisma migrate deploy` before `next build`
- Created `vercel.json` with explicit buildCommand
- This ensures migrations are applied automatically on every Vercel deploy

### Error 2: JWTSessionError "Invalid Compact JWE"
**Problem**: Stale cookies from when AUTH_SECRET was different, or missing AUTH_SECRET.

**Solution**:
- Added AUTH_SECRET validation in `lib/auth.ts`
- If users see this error after deploy: Clear cookies and re-login
- Ensure AUTH_SECRET env var is set in Vercel dashboard

## Migration Status
The migration file `prisma/migrations/20260114000000_add_password_and_email_verification/migration.sql` adds:
- `passwordHash` column to User table (TEXT, nullable)
- `EmailVerificationToken` table for email verification

## Post-Deployment Checklist
1. ✅ Verify AUTH_SECRET is set in Vercel Environment Variables
2. ✅ Push code with updated build scripts
3. ✅ Vercel will auto-run `prisma migrate deploy` during build
4. ✅ If users get JWTSessionError: Advise them to clear cookies or re-login
5. ✅ Test signup/login on production

## Environment Variables Required in Vercel
- `DATABASE_URL` - Neon PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Production URL (e.g., https://your-app.vercel.app)
- `RESEND_API_KEY` - Resend API key for emails
- `EMAIL_FROM` - Sender email address

## If Migration Fails on Vercel
Check Vercel build logs. If `prisma migrate deploy` fails:
1. Ensure DATABASE_URL is correct and accessible
2. Manually apply migration via Neon dashboard SQL editor:
   ```sql
   -- Copy contents from prisma/migrations/20260114000000_add_password_and_email_verification/migration.sql
   ```

