# 12 — Deployment & DevOps

## What This Covers

How the application is deployed (Render for backend, Vercel for frontend), the production build process, SPA routing configuration, environment variable management, and database seeding.

---

## Deployment Architecture

```
┌─────────────────────┐        ┌─────────────────────┐        ┌──────────────────┐
│   Vercel (Frontend)  │  HTTP  │   Render (Backend)   │  TCP   │  MongoDB Atlas   │
│                      │ ◄────► │                      │ ◄────► │  (Cloud DB)      │
│  React Build (static)│        │  Node.js + Express   │        │                  │
│  vercel.json rewrites│        │  render.yaml config  │        │  Connection URI  │
└─────────────────────┘        └─────────────────────┘        └──────────────────┘
```

### Why Separate Hosting?

- **Frontend (Vercel)**: Optimized for static assets and CDN delivery. Free tier with global edge network.
- **Backend (Render)**: Runs Node.js process with persistent server. Free tier supports web services.
- **Database (MongoDB Atlas)**: Cloud-hosted database with built-in backups and monitoring.

**Alternative**: Deploy both as a monolith on Render (backend serves frontend build). The `index.js` already supports this:

```js
// Serve React build files in production
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
```

---

## Render Configuration (Backend)

```yaml
# render.yaml
services:
  - type: web
    name: college-erp-backend
    runtime: node
    buildCommand: npm install && cd backend && npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Key Points

- **Build command**: Installs root dependencies, then backend dependencies
- **Start command**: `npm start` runs `node index.js` (no nodemon in production)
- **Environment variables**: Set in Render dashboard (not in the YAML for security)

### Render Limitations

- **Ephemeral filesystem**: Uploaded files are **lost on every deploy**. The `./media` directory resets.
- **Cold starts**: Free tier spins down after 15 minutes of inactivity. First request takes ~30 seconds.
- **No sticky sessions**: If scaled to multiple instances, localStorage-based auth works fine (stateless JWT).

---

## Vercel Configuration (Frontend)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "..." }
      ]
    }
  ]
}
```

### SPA Rewrite Rule

```json
{ "source": "/(.*)", "destination": "/" }
```

**What it does**: Every URL (e.g., `/admin/student`, `/faculty/marks`) is rewritten to serve `index.html`. React Router then handles the routing client-side.

**Why it's needed**: Without this, navigating directly to `/admin/student` returns a 404 because there's no physical `admin/student/index.html` file. The rewrite ensures the SPA shell loads and React Router takes over.

### CORS Headers

The Vercel config adds CORS headers for `/api/` routes. However, since the frontend is on Vercel and the API is on Render, these headers are for Vercel's serverless functions (if any were used). The actual CORS configuration lives in the Express backend.

---

## Build Process

### Frontend Build

```bash
npm run build  # react-scripts build
```

Creates an optimized production bundle in `frontend/build/`:
- Minified JavaScript bundles
- Compressed CSS
- Hashed filenames for cache busting
- `index.html` with script/style references

### Backend "Build"

No build step — Node.js runs JavaScript directly. The `npm start` command runs `node index.js`.

---

## Environment Variables

### Backend (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Token signing key | Long random string |
| `PORT` | Server port | `4000` |
| `FRONTEND_API_LINK` | CORS allowed origin | `https://frontend.vercel.app` |
| `NODEMAILER_EMAIL` | Gmail for reset emails | `your-email@gmail.com` |
| `NODEMAILER_PASS` | Gmail app password | App-specific password |

### Frontend (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_APILINK` | Backend API base URL | `https://backend.render.com/api` |

**Why `REACT_APP_` prefix?** Create React App only embeds environment variables prefixed with `REACT_APP_` into the build. This prevents accidental exposure of server-side secrets.

**Important**: Frontend env vars are **baked into the build**. Changing them requires a rebuild, not a restart.

---

## Database Seeding

```bash
npm run seed  # node admin-seeder.js
```

```js
const seedData = async () => {
  await connectToMongo();
  await adminDetails.deleteMany({});  // Clear existing
  await adminDetails.create({
    employeeId: 123456,
    firstName: "Sundar",
    password: "admin123",
    isSuperAdmin: true,
    // ...
  });
  await mongoose.connection.close();
  process.exit();
};
```

### Why Seeding Matters

- Creates the first admin account (without auth — chicken-and-egg problem)
- `deleteMany({})` ensures idempotency — can be run multiple times safely
- Prints credentials to console for first login
- Closes connection and exits process explicitly

### The Chicken-and-Egg Problem

You need an admin to create other admins. But who creates the first admin? The seeder solves this by running directly against the database, bypassing the API.

---

## Monolith Deployment Alternative

The `index.js` already supports serving the frontend:

```js
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
```

This means you CAN deploy everything on Render as a single service:
1. Build frontend: `cd frontend && npm run build`
2. Start backend: `node backend/index.js`
3. Backend serves both API routes and static frontend files

**Tradeoff**: Simpler deployment but no CDN for static files, and the Node.js server handles static file requests (not its strength).

---

## What Could Break If Changed

1. **Remove SPA rewrite on Vercel** → Direct URL navigation returns 404
2. **Wrong `REACT_APP_APILINK`** → Frontend calls wrong backend; all API requests fail
3. **Change `PORT` without updating Render** → Server starts but Render can't route traffic to it
4. **Remove `deleteMany` from seeder** → Running seed twice creates duplicate admins
5. **Forget `process.exit()` in seeder** → Script hangs indefinitely after seeding

---

## Most Likely Interview Questions

**Q: How did you deploy your application?**
> The frontend is deployed on Vercel as a static SPA with a rewrite rule that redirects all routes to `index.html` for client-side routing. The backend runs on Render as a Node.js web service. MongoDB Atlas hosts the database. Environment variables store all secrets, and the backend can optionally serve the frontend build as a monolith.

**Q: Why separate hosting for frontend and backend?**
> Vercel provides a CDN for static files, delivering the React bundle from edge servers close to the user. Render runs the Node.js process. Separating them optimizes each layer for its strength. The tradeoff is CORS configuration and two deployment pipelines instead of one.

**Q: What happens when a user navigates to `/admin/student` directly?**
> On Vercel, the rewrite rule serves `index.html` for any URL. The browser loads the React app, React Router matches `/admin/student`, and renders the Student management component. Without the rewrite, Vercel would return a 404.

**Q: How do you manage environment variables across environments?**
> Each environment (local, staging, production) has its own `.env` file. On deployment platforms (Render, Vercel), environment variables are set through the dashboard. Frontend variables use the `REACT_APP_` prefix and are baked into the build. Backend variables are read at runtime via `process.env`.

---

## Cross/Follow-up Questions

- *How would you set up CI/CD?* → GitHub Actions: run tests → build frontend → deploy to Vercel/Render on main branch push.
- *How do you handle database migrations?* → MongoDB doesn't require migrations. For schema changes, write a one-time migration script (similar to the seeder).
- *What about monitoring?* → Use Render's built-in logs + add a monitoring service like Sentry for error tracking and UptimeRobot for availability.
- *How do you handle zero-downtime deployments?* → Render's free tier restarts on deploy (brief downtime). For zero-downtime, use rolling deploys with multiple instances.

---

## Why This Implementation Matters

Deployment questions test:
- Understanding of the full stack lifecycle (dev → build → deploy)
- Knowledge of SPA routing challenges
- Awareness of platform-specific limitations
- Ability to reason about infrastructure tradeoffs

---

## Common Mistakes / Edge Cases

1. **CORS mismatch**: Backend `FRONTEND_API_LINK` must exactly match the Vercel domain (including `https://`)
2. **Missing trailing slash**: `https://api.render.com/api` vs `https://api.render.com/api/` — can cause routing issues
3. **Build-time vs runtime variables**: Frontend env vars are fixed at build time. Changing them requires a new build.
4. **Render cold starts**: First request after inactivity takes 30+ seconds. Use a health check pinger (UptimeRobot) to keep it warm.
5. **File uploads on Render**: Ephemeral filesystem means all uploaded files are lost on deploy. Must migrate to cloud storage for production.
