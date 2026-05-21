# 03 — Authentication & Authorization

## What This Covers

The complete JWT-based authentication system: login, registration, password hashing, token verification middleware, password reset via email, and password change while logged in.

---

## Authentication Flow Diagram

```
  ┌──────────┐    POST /api/admin/login      ┌──────────────┐
  │  Client   │ ─────────────────────────────► │  Controller   │
  │ (React)   │   { email, password }         │              │
  └──────────┘                                │  1. Find user │
       ▲                                      │  2. bcrypt.   │
       │                                      │     compare() │
       │   { token: "eyJ..." }                │  3. jwt.sign()│
       └──────────────────────────────────────│  4. Return    │
                                              └──────────────┘

  Subsequent requests:
  ┌──────────┐  Authorization: Bearer eyJ...   ┌──────────────┐
  │  Client   │ ─────────────────────────────► │ Auth Middleware│
  │ (React)   │                                │               │
  └──────────┘                                 │ jwt.verify()  │
       ▲                                       │ req.userId =  │
       │        Proceed / 401                  │   decoded.id  │
       └───────────────────────────────────── │ next()        │
                                               └──────────────┘
```

---

## Login Implementation

### How it works (all three roles follow the same pattern):

1. **Receive** `email` and `password` from request body
2. **Find** user by email in the role-specific collection
3. **Compare** provided password against stored bcrypt hash using `bcrypt.compare()`
4. **Generate** JWT with `{ userId: user._id }` payload, 1-hour expiry
5. **Return** the token in the response body

### Why these choices:

- **Email-based login** (not username): Emails are naturally unique and recoverable.
- **Role-specific endpoints** (`/api/admin/login`, `/api/faculty/login`, `/api/student/login`): Each role queries a different collection. One shared `/login` endpoint would need to search all three collections.
- **1-hour token expiry**: Balances security (short window for stolen tokens) with UX (user doesn't need to re-login every 5 minutes).
- **Token in response body** (not cookie): Stateless approach — frontend stores it, backend doesn't track sessions. Simpler for SPAs.

---

## Password Hashing

### bcrypt with salt round 10

```js
// At registration (via pre-save hook):
this.password = await bcrypt.hash(this.password, 10);

// At update (manual hashing):
const salt = await bcrypt.genSalt(10);
updateData.password = await bcrypt.hash(password, salt);
```

### Why bcrypt?

- **Adaptive**: Salt round 10 means 2^10 = 1024 iterations. Can be increased as hardware gets faster.
- **Built-in salt**: Each hash includes a unique salt, so identical passwords produce different hashes.
- **Slow by design**: Prevents brute-force attacks. ~100ms per hash vs. SHA256's nanoseconds.

### Why salt round 10?

- Industry standard for web apps. Round 12 doubles the time. Round 10 takes ~100ms on modern hardware — fast enough for login, slow enough to deter brute force.

### The `pre('save')` Hook vs Manual Hashing

| Scenario | Hook Fires? | Manual Hash Needed? |
|----------|------------|-------------------|
| `Model.create({ password: "abc" })` | ✅ Yes | No |
| `new Model().save()` | ✅ Yes | No |
| `Model.findByIdAndUpdate(id, { password })` | ❌ No | ✅ Yes |
| `Model.updateOne({ _id }, { password })` | ❌ No | ✅ Yes |

**This is the #1 gotcha**. The controllers correctly handle this by manually hashing in `updateDetailsController` and `updateLoggedInPasswordController`.

---

## JWT Token Structure

```js
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});
```

**Payload**: `{ userId: "64abc..." }` — only the MongoDB ObjectId. No role info, no email.

**Why no role in the token?**
- The frontend already knows the role (stored in `localStorage`). 
- The backend routes are role-specific (`/api/admin/my-details`), so the endpoint itself implies the role.
- **Limitation**: The auth middleware can't enforce "only admins can access this endpoint." Any valid token works on any endpoint.

---

## Auth Middleware Deep Dive

```js
const auth = async (req, res, next) => {
  let token = req.header("Authorization");
  
  if (!token || !token.startsWith("Bearer ")) {
    return ApiResponse.unauthorized("Authentication token required").send(res);
  }
  
  token = token.split(" ")[1];
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded.userId) {
    return ApiResponse.unauthorized("Invalid token format").send(res);
  }
  
  req.userId = decoded.userId;
  req.token = token;
  next();
};
```

### Key decisions:

1. **Bearer scheme**: Standard OAuth 2.0 format. `Authorization: Bearer <token>`.
2. **`req.userId` injection**: Downstream controllers access the authenticated user's ID without re-parsing the token.
3. **No database lookup**: The middleware trusts the JWT without checking if the user still exists. Fast, but a deleted user's token still works until expiry.
4. **Double try-catch**: Outer catch handles unexpected errors; inner catch specifically handles JWT errors (expired, malformed).

### What this middleware does NOT do:

- ❌ Check if the user exists in the database
- ❌ Verify the user's role
- ❌ Check if the token has been revoked/blacklisted
- ❌ Rate-limit authentication attempts

---

## Password Reset Flow (Email-Based)

This is the most complex flow in the app:

```
Step 1: User clicks "Forgot Password"
        POST /api/admin/forget-password { email }
        
Step 2: Server generates a short-lived JWT (10 min expiry)
        Stores it in ResetPassword collection with userId
        Sends email with link: /admin/update-password/{resetId}
        
Step 3: User clicks email link, enters new password
        POST /api/admin/update-password/{resetId} { password }
        
Step 4: Server finds ResetPassword record by ID
        Verifies the embedded JWT hasn't expired
        Hashes new password, updates user
        Deletes all reset tokens for this user
```

### Why two tokens (JWT + DB record)?

- The **JWT** provides time-based expiry (10 minutes)
- The **DB record** allows one-time use (deleted after use)
- The **resetId** (MongoDB ObjectId) is what goes in the URL — shorter and safer than exposing the raw JWT

### Why delete ALL reset tokens for the user?

```js
await resetToken.deleteMany({ type: "AdminDetails", userId: verifyToken._id });
```

If a user requests multiple reset emails, only the latest should work. Deleting all prevents old links from being used.

---

## Password Change While Logged In

```
POST /api/admin/change-password
Headers: Authorization: Bearer <token>
Body: { currentPassword, newPassword }
```

1. Verify the current password matches (prevents someone with a stolen token from changing the password without knowing the current one)
2. Validate new password is at least 8 characters
3. Hash and update

### Why require the current password?

Even though the user is authenticated via JWT, requiring the current password adds a second verification layer. This protects against:
- Stolen tokens
- Users who left their browser open
- CSRF-like scenarios

---

## Frontend Token Management

```js
// On login success:
localStorage.setItem("userToken", token);
localStorage.setItem("userType", selected);  // "Admin", "Faculty", "Student"
dispatch(setUserToken(token));

// On every API call (AxiosWrapper):
headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` }

// On logout:
localStorage.removeItem("userToken");
localStorage.removeItem("userType");
```

### Why localStorage over cookies?

| Aspect | localStorage (Chosen) | HTTP-Only Cookies |
|--------|----------------------|-------------------|
| XSS vulnerability | ❌ Accessible to JS (vulnerable) | ✅ Not accessible to JS |
| CSRF vulnerability | ✅ Not sent automatically | ❌ Sent with every request |
| Implementation | ✅ Simple | ⚠️ Requires `sameSite`, `secure` flags |
| Cross-domain | ✅ Works with any API domain | ⚠️ Needs specific domain config |

**Interview answer**: "We used localStorage for simplicity, but it's vulnerable to XSS. In production, I'd use HTTP-only cookies with the `secure` and `sameSite` flags."

---

## Default Passwords — A Design Decision

```js
// Admin registration:
password: "admin123"
// Faculty registration:
password: "faculty123"
// Student registration:
password: "student123"
```

**Why**: Admin creates users; they get a default password and are expected to change it via the password reset flow.

**Risk**: If the email system fails, users are stuck with known default passwords. In production, you'd force a password change on first login.

---

## What Could Break If Changed

1. **Change JWT secret** → All existing tokens invalidate instantly, everyone gets logged out
2. **Remove `isModified()` check** → Passwords get double-hashed on every save, login breaks
3. **Change `expiresIn` to "10s"** → Users get logged out every 10 seconds
4. **Remove `Bearer ` prefix check** → Raw tokens work, but the frontend sends `Bearer <token>`, so it would break
5. **Change `userId` claim name** → Auth middleware looks for `decoded.userId`; changing it breaks everything

---

## Most Likely Interview Questions

**Q: How does authentication work in your project?**
> On login, the server verifies the password with bcrypt, generates a JWT with the user's MongoDB ObjectId, and returns it. The frontend stores it in localStorage and sends it as a Bearer token on every subsequent request. The auth middleware verifies the token and injects `req.userId` for controllers to use.

**Q: Why JWT over sessions?**
> JWT is stateless — the server doesn't need to store sessions, which simplifies horizontal scaling. The tradeoff is you can't revoke tokens before expiry without maintaining a blacklist, which we don't currently have.

**Q: Explain the password reset flow.**
> User submits their email. Server generates a 10-minute JWT, stores it in a `ResetPassword` record, and emails a link containing the record's ID. When the user clicks and submits a new password, the server finds the record, verifies the JWT hasn't expired, hashes the new password, updates the user, and deletes all reset tokens for that user.

**Q: What happens if a user's token expires mid-session?**
> The next API call returns a 401. The AxiosWrapper interceptor detects this, clears localStorage, and redirects to the login page automatically.

**Q: Why is `pre('save')` not enough for password hashing?**
> Because Mongoose's `pre('save')` middleware only fires on `.save()` and `.create()`, not on `findByIdAndUpdate()` or `updateOne()`. Since updates use `findByIdAndUpdate`, we must manually hash passwords in those controllers.

---

## Cross/Follow-up Questions

- *How would you implement token refresh?* → Issue a short-lived access token (15 min) + long-lived refresh token (7 days). Frontend uses refresh token to get new access tokens silently.
- *How would you handle token revocation?* → Maintain a Redis blacklist of revoked tokens. Check on every request.
- *What if someone steals the JWT secret?* → They can forge tokens for any user. Rotate the secret immediately and redeploy. All existing tokens become invalid.
- *Why not use OAuth/SSO?* → Would add third-party dependency. Fine for a college project; a real institution might use SAML/OAuth with their identity provider.

---

## Why This Implementation Matters

Authentication is the **most-asked topic in backend interviews**. You need to:
- Explain the full lifecycle (login → token → verification → expiry)
- Know bcrypt internals (salt rounds, timing attacks, `isModified`)
- Articulate security tradeoffs (localStorage vs. cookies, JWT vs. sessions)
- Identify weaknesses honestly (no revocation, no rate limiting, default passwords)

---

## Common Mistakes / Edge Cases

1. **Double hashing**: Calling `save()` after manually hashing → `pre('save')` hashes again
2. **Token decode vs verify**: `jwt.decode()` doesn't validate signature; `jwt.verify()` does. Always use `verify()`.
3. **Missing return statement**: In auth middleware, forgetting `return` before `ApiResponse.unauthorized()` lets `next()` run anyway
4. **Empty JWT secret**: If `JWT_SECRET` is undefined, `jwt.sign()` uses empty string — massive security hole
5. **Race condition**: Two simultaneous reset requests could both succeed, but `deleteMany()` cleanup handles this
