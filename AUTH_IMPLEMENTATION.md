# Work 04 — Authentication Implementation

## Credentials and password storage

- Auth.js Credentials provider.
- Passwords hashed with Argon2id.
- Email normalized to lower-case before lookup/write.
- Login failure uses a generic credential error.
- Password hash is never serialized to customer API responses.

## Session strategy

Work 04 uses Auth.js signed HttpOnly JWT sessions for the Credentials provider. A database-session strategy was not forced because current Auth.js Credentials behavior requires JWT strategy rather than creating adapter sessions reliably.

This does not mean authorization trusts JWT data blindly. Every customer API request and protected page layout:

1. reads the Auth.js session;
2. loads the user from PostgreSQL;
3. requires `ACTIVE` status;
4. requires `CUSTOMER` role;
5. requires JWT `sessionVersion` to equal database `sessionVersion`.

This preserves real refresh-safe sessions while allowing server-side revocation through `sessionVersion`.

## Registration

Registration validates input and hashes the password before a single database transaction creates:

- User
- Wallet with zero balance
- NotificationPreference

Duplicate normalized email returns `EMAIL_IN_USE`.

## Password change

The backend verifies the current Argon2id hash, validates the new password, writes a new Argon2id hash, updates the password-change timestamp, and increments `sessionVersion`.

The client then signs out and returns to `/login`. Old JWT sessions fail server authorization even if a stale cookie remains elsewhere.

## Logout

Logout calls Auth.js `signOut`, ending the browser session cookie. There is no mock login state in the production repository path.

## Protected customer routes

The `(app)` layout server guard redirects unauthenticated/invalid customer sessions to `/login`. The `(auth)` layout redirects an already authenticated customer to `/dashboard`.

## Password reset request limitation

Work 04 stores a hashed, expiring reset token and always returns a generic accepted response to avoid account enumeration. Email delivery and the complete reset-link consumer are not implemented because an email provider is outside this Work. This is listed as a known limitation rather than simulated success.


## Same-origin mutation guard

Work 04 customer POST/PATCH API routes validate the `Origin` header when supplied. Cross-origin browser mutations are rejected with `FORBIDDEN`; authentication and ownership checks still run server-side and no browser-supplied user ID is trusted.
