# 01 — System Architecture & Project Structure

## What This Covers

The overall architecture of the College ERP system: how the frontend, backend, and database interact, why the project is structured the way it is, and what design patterns are used.

---

## High-Level Architecture

```
┌────────────────────┐       HTTP/REST        ┌──────────────────────┐       Mongoose       ┌───────────────┐
│    React Frontend   │ ◄──────────────────► │   Express Backend     │ ◄──────────────────► │   MongoDB      │
│   (CRA + Tailwind)  │   JSON + JWT Bearer   │   (Node.js + JWT)     │   ODM Queries       │   (Atlas)      │
└────────────────────┘                        └──────────────────────┘                      └───────────────┘
        ▲                                              │
        │                                              ▼
   localStorage                                   /media (disk)
   (token, userType)                              File Uploads
```

### Why This Architecture?

- **MERN Stack**: Industry-standard for full-stack JS apps. Single language across the stack reduces context-switching.
- **Monorepo**: Both `frontend/` and `backend/` live in one repository — simpler CI/CD, easier code navigation, atomic commits.
- **REST over GraphQL**: Straightforward CRUD operations don't benefit from GraphQL's complexity. REST is simpler to implement, debug, and explain.
- **MongoDB over SQL**: Schema flexibility for user profiles (admin/faculty/student have different fields), no complex joins needed, and Mongoose provides schema validation anyway.

---

## Project Structure Breakdown

```
College-Management-System/
├── backend/
│   ├── index.js                  ← Entry point: Express server, route mounting, static file serving
│   ├── app.js                    ← Express app factory (unused — index.js is the actual entry)
│   ├── Database/
│   │   └── db.js                 ← MongoDB connection via Mongoose
│   ├── models/                   ← Mongoose schemas
│   │   ├── details/              ← User models (admin, faculty, student)
│   │   ├── branch.model.js
│   │   ├── subject.model.js
│   │   ├── notice.model.js
│   │   ├── exam.model.js
│   │   ├── marks.model.js
│   │   ├── material.model.js
│   │   ├── timetable.model.js
│   │   └── reset-password.model.js
│   ├── controllers/              ← Business logic handlers
│   │   ├── details/              ← User CRUD controllers
│   │   └── *.controller.js       ← Domain-specific controllers
│   ├── routes/                   ← Route definitions
│   │   ├── details/              ← User routes
│   │   └── *.route.js            ← Domain-specific routes
│   ├── middlewares/
│   │   ├── auth.middleware.js    ← JWT verification
│   │   └── multer.middleware.js  ← File upload config
│   ├── utils/
│   │   ├── ApiResponse.js        ← Standardized response class
│   │   └── SendMail.js           ← Nodemailer utility
│   ├── media/                    ← Uploaded files directory
│   └── admin-seeder.js           ← Database seeding script
├── frontend/
│   ├── src/
│   │   ├── App.jsx               ← Route definitions + protected routes
│   │   ├── Screens/              ← Page-level components
│   │   │   ├── Admin/            ← Admin dashboard pages
│   │   │   ├── Faculty/          ← Faculty dashboard pages
│   │   │   ├── Student/          ← Student dashboard pages
│   │   │   ├── Login.jsx
│   │   │   └── ForgetPassword.jsx
│   │   ├── components/           ← Reusable UI components
│   │   ├── redux/                ← State management
│   │   ├── utils/
│   │   │   └── AxiosWrapper.js   ← Axios instance with interceptors
│   │   └── baseUrl.js            ← API URL configuration
│   └── vercel.json               ← Vercel deployment config
└── render.yaml                   ← Render deployment config
```

---

## Design Pattern: MVC (Model-View-Controller)

This project follows a modified MVC pattern:

| MVC Layer | Implementation | Example |
|-----------|---------------|---------|
| **Model** | Mongoose schemas in `models/` | `student-details.model.js` defines the StudentDetail schema |
| **View** | React components in `frontend/src/` | `Login.jsx` renders the login form |
| **Controller** | Handler functions in `controllers/` | `loginStudentController` handles login business logic |
| **Router** (extra) | Route files in `routes/` | `student-details.route.js` maps URLs to controllers |

### Why separate Routes from Controllers?

- **Single Responsibility**: Routes define URL mapping + middleware chain; controllers contain business logic.
- **Testability**: Controllers can be unit-tested without Express. Routes can be swapped independently.
- **Readability**: Looking at a route file, you instantly see all endpoints. Looking at a controller, you see only logic.

---

## Server Initialization Flow

The `index.js` file follows a specific order that matters:

```
1. Connect to MongoDB        ← connectToMongo() called immediately
2. Configure middleware       ← express.json(), CORS
3. Mount API routes           ← /api/admin, /api/student, etc.
4. Serve static media         ← /media → ./media directory
5. Serve React build          ← express.static for production
6. Catch-all route            ← app.get("*") → index.html (SPA routing)
7. Start listening            ← app.listen(port)
```

### Why does order matter?

API routes MUST be mounted before the catch-all `*` route. If reversed, every API request would return the React `index.html` instead of JSON data. This is a common deployment bug.

---

## Tradeoffs & Alternatives

| Decision | Chosen | Alternative | Why This Way |
|----------|--------|-------------|-------------|
| Monorepo | ✅ Single repo | Separate repos | Simpler for a small team, atomic commits |
| Express entry | `index.js` inline | `app.js` factory pattern | `app.js` exists but isn't used — slight code smell |
| File storage | Local disk (`./media`) | AWS S3 / Cloudinary | Simpler for MVP, but doesn't scale across servers |
| DB connection | Connect-and-forget | Connection pooling with retry | Mongoose handles pooling internally |
| No ORM migrations | Schema defined in code | Migration files (like Sequelize) | MongoDB is schemaless by nature; Mongoose validation is sufficient |

---

## What Could Break If Changed

1. **Move API routes after catch-all**: All API calls return HTML instead of JSON
2. **Remove `credentials: true` from CORS**: Browser won't send cookies/auth headers cross-origin
3. **Change `FRONTEND_API_LINK`**: CORS blocks all frontend requests
4. **Remove `express.json()` middleware**: `req.body` is `undefined` for all POST/PATCH requests
5. **Change port without updating env**: Server starts on wrong port, frontend can't connect

---

## Most Likely Interview Questions

**Q: Explain the overall architecture of your project.**
> It's a MERN stack application with a monorepo structure. React frontend communicates with Express backend via REST APIs. The backend uses Mongoose as an ODM for MongoDB. Authentication is JWT-based, and the app supports three roles: Admin, Faculty, and Student. Each role has its own model, controller, and route set.

**Q: Why did you choose the MERN stack?**
> JavaScript across the entire stack reduces context-switching. React's component model is great for the multi-dashboard UI. MongoDB's flexibility suits user profiles where admin, faculty, and student have different fields. Express is lightweight and well-documented.

**Q: What design pattern does your backend follow?**
> A modified MVC pattern. Models are Mongoose schemas, Controllers handle business logic, and Routes map URLs to controllers with middleware chains. The "View" layer is the React frontend.

**Q: What happens when a user hits a URL like `/admin/student`?**
> If it's a fresh page load in production, Express serves the React `index.html` via the catch-all route. React Router then renders the correct component. If it's an API call like `/api/student`, Express matches it to the student route handler first, before the catch-all.

---

## Cross/Follow-up Questions

- *What's the difference between `app.js` and `index.js`?* → `app.js` exists as a leftover; `index.js` is the actual entry point that configures everything.
- *How would you split this into microservices?* → Separate Auth, User Management, and Academic services with their own DBs. Use API Gateway for routing.
- *Why not use TypeScript?* → Time constraints. Would add type safety to models and controllers if doing again.

---

## Why This Implementation Matters

Understanding the architecture is the **first thing interviewers probe**. It demonstrates:
- You didn't just copy code — you understand why things are structured this way
- You know what would break if the structure changes
- You can reason about tradeoffs (monorepo vs. polyrepo, REST vs. GraphQL, SQL vs. NoSQL)

---

## Common Mistakes / Edge Cases

1. **Forgetting to call `connectToMongo()`** — Server starts but every DB query fails with "MongoNotConnectedError"
2. **CORS misconfiguration** — Setting `origin: "*"` with `credentials: true` doesn't work; browsers block it
3. **Missing `express.json()`** — All request bodies come through as `undefined`
4. **Catch-all route before API routes** — APIs stop working in production
5. **`app.js` vs `index.js` confusion** — The actual server runs from `index.js`, not `app.js`
