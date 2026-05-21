# 09 — Security Practices

## What This Covers

All security measures implemented (and missing), including input validation, CORS, environment variables, password handling, XSS/CSRF protection, and what a production-ready version would need.

---

## Security Measures Implemented

### 1. Password Hashing (bcrypt)

- Passwords are NEVER stored in plaintext
- bcrypt with salt round 10 (~100ms per hash)
- Each hash includes a random salt — same password → different hashes
- Resistant to rainbow table attacks

### 2. Password Exclusion from API Responses

Every query that returns user data explicitly excludes the password:

```js
.select("-password -__v")
```

**Why `-__v`?** `__v` is Mongoose's internal version key. No need to expose it to clients.

**Why this matters**: Even if the response is intercepted, the password hash is not leaked.

### 3. JWT-Based Stateless Auth

- Tokens expire after 1 hour
- Signed with a secret key (not public/private key pair)
- Only contains `userId` — minimal claims
- Reset tokens expire after 10 minutes

### 4. CORS Configuration

```js
app.use(cors({
  origin: process.env.FRONTEND_API_LINK,
  credentials: true,
}));
```

- Only the frontend domain can make requests
- `credentials: true` allows cookies and auth headers
- Other domains get blocked by the browser's CORS preflight

### 5. Environment Variables

Secrets stored in `.env`, not in code:
- `MONGODB_URI` — Database connection string
- `JWT_SECRET` — Token signing key
- `NODEMAILER_EMAIL` / `NODEMAILER_PASS` — Email credentials
- `FRONTEND_API_LINK` — CORS allowed origin

`.env` is in `.gitignore` — never committed to version control.

### 6. Input Validation

Email and phone validation with regex:
```js
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ... }
if (!/^\d{10}$/.test(phone)) { ... }
```

Password minimum length:
```js
if (password && password.length < 8) { ... }
```

Enum validation at schema level:
```js
gender: { enum: ["male", "female", "other"] }
```

### 7. Uniqueness Checks

Before creating users, controllers check for existing records:
```js
const existing = await adminDetails.findOne({ $or: [{ phone }, { email }] });
```

Prevents duplicate accounts that could cause data integrity issues.

---

## Security Gaps (Know These for Interviews)

### 🔴 Critical: Registration Endpoints Are Public

```js
router.post("/register", upload.single("file"), registerAdminController);
```

**No `auth` middleware!** Anyone can register new admins, faculty, or students without being authenticated.

**Impact**: An attacker can create admin accounts and gain full system access.

**Fix**: Add auth middleware and require admin role:
```js
router.post("/register", auth, requireRole("admin"), upload.single("file"), registerAdminController);
```

### 🔴 Critical: No Role Verification in Auth Middleware

The `auth` middleware only verifies the JWT is valid. It doesn't check if the user is an admin, faculty, or student. Any authenticated user can call any endpoint.

### 🟡 Important: Default Passwords

```js
password: "admin123"    // Admin registration
password: "faculty123"  // Faculty registration
password: "student123"  // Student registration
```

If a user doesn't change their password immediately, the account is vulnerable.

**Fix**: Force password change on first login. Set a `mustChangePassword` flag.

### 🟡 Important: No Rate Limiting

No protection against:
- Brute-force login attempts
- Password reset email flooding
- API abuse

**Fix**: Use `express-rate-limit`:
```js
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);
```

### 🟡 Important: No File Type/Size Validation

Multer accepts any file type and size. Malicious executables can be uploaded.

### 🟡 Important: Regex Injection in Search

```js
{ firstName: { $regex: name, $options: "i" } }
```

User input passed directly to `$regex`. Crafted patterns can cause ReDoS.

### 🟢 Minor: No Token Blacklisting

When a user changes their password, old tokens remain valid until expiry. No way to revoke tokens.

### 🟢 Minor: No HTTPS Enforcement

No redirect from HTTP to HTTPS at the application level (handled by Render/Vercel in production).

### 🟢 Minor: No Helmet.js

No security headers (X-Content-Type-Options, X-Frame-Options, etc.).

---

## How the Password Reset is Secured

```
1. User submits email           → Server doesn't reveal if email exists (but does via 404 — info leak)
2. JWT created (10 min expiry)  → Short window limits exposure
3. Stored in DB                 → Enables one-time use (deleted after use)
4. Email link contains resetId  → MongoDB ObjectId, not the raw JWT
5. Old tokens deleted           → Prevents replay attacks
6. New password hashed          → bcrypt before storing
```

### Info Leak: "User Not Found"

```js
if (!user) {
  return ApiResponse.notFound("No Admin Found").send(res);
}
```

This reveals whether an email is registered. An attacker can enumerate valid emails.

**Fix**: Always return "If this email exists, a reset link was sent" regardless.

---

## Mass Assignment Vulnerability

```js
// Exam controller - spreads entire body
const exam = await Exam.create(formData);

// vs. Admin controller - explicit destructuring
const { email, phone } = req.body;
```

Some controllers spread `req.body` directly into Mongoose operations. A malicious user could add fields like `isSuperAdmin: true` to the request body.

**Fix**: Always explicitly extract expected fields. Use Mongoose's `select` or a validation library like `joi` or `zod`.

---

## What Could Break If Changed

1. **Remove `.select("-password")`** → Password hashes leaked in every user response
2. **Set `JWT_SECRET` to empty string** → Tokens signed with empty key are trivially forged
3. **Remove CORS config** → Browsers allow any site to make requests (or block everything)
4. **Commit `.env` to Git** → All secrets exposed in repository history
5. **Remove `isModified()` from pre-save hook** → Double hashing on every update

---

## Most Likely Interview Questions

**Q: How do you handle security in your project?**
> Multiple layers: passwords are hashed with bcrypt (salt round 10), never returned in API responses. Authentication uses JWT with 1-hour expiry. CORS is configured to only allow the frontend domain. Secrets are in environment variables, not code. Input validation is done at both controller and schema levels. That said, there are gaps — no rate limiting, no role verification middleware, and registration endpoints are public.

**Q: What are the security vulnerabilities you're aware of?**
> The biggest one is that registration endpoints don't require authentication — anyone can create admin accounts. Second, the auth middleware doesn't verify roles, so a student's JWT could theoretically access admin endpoints. Third, there's no rate limiting on login or password reset, making brute-force attacks possible. Fourth, no file type validation on uploads.

**Q: How would you improve the security?**
> Add a `requireRole()` middleware for role verification. Protect registration endpoints with admin authentication. Implement rate limiting with `express-rate-limit`. Add file type/size validation to multer. Use `helmet.js` for security headers. Implement token blacklisting via Redis. Force password change on first login.

**Q: What's the difference between authentication and authorization?**
> Authentication verifies identity — "who are you?" (our JWT system). Authorization verifies permissions — "what can you do?" (our RBAC system, though it needs improvement). We authenticate well but authorize poorly.

---

## Cross/Follow-up Questions

- *How would you prevent CSRF attacks?* → JWT in Authorization header (not cookies) already mitigates CSRF since browsers don't automatically send custom headers.
- *What about XSS?* → React auto-escapes JSX output, preventing most XSS. But `dangerouslySetInnerHTML` in the reset email HTML could be a vector if the frontend rendered email content.
- *How would you implement API key auth for third-party access?* → Generate API keys stored in DB, validate them in a separate middleware. Different from user JWT auth.
- *What is bcrypt's timing-safe comparison?* → `bcrypt.compare()` runs in constant time regardless of where the mismatch occurs, preventing timing attacks that could reveal partial password matches.

---

## Why This Implementation Matters

Security is a **dealbreaker topic** in interviews. Saying "I used bcrypt and JWT" is insufficient. You need to:
- Identify what's secure AND what's not
- Explain WHY each measure exists
- Propose improvements for gaps
- Show awareness of attack vectors (brute force, injection, XSS, CSRF)

---

## Common Mistakes / Edge Cases

1. **`bcrypt.compare()` vs `===`**: Never compare hashes with `===`. Each bcrypt hash has a different salt, so the same password produces different hashes.
2. **JWT secret in code**: Hard-coding `jwt.sign({}, "mysecret")` exposes the secret in Git history forever.
3. **CORS `origin: "*"` with `credentials: true`**: Browsers reject this combination. Must specify an exact origin.
4. **Trusting `req.body` completely**: Without validation, any field in the request body gets saved to the database.
5. **Logging passwords**: `console.log(req.body)` during debugging accidentally logs passwords. The admin seeder logs the password in plaintext.
