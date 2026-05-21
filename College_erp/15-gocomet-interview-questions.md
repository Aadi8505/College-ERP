# 15 — Gocomet Full Stack Intern — Probable Interview Questions

> Mapped to the JD: **Full Stack Developer Intern – Python (FastAPI) + React**
> Every question below is something the interviewer could realistically ask. Answers reference YOUR College ERP project wherever possible.

---

## 🔴 Section 1: About Your Project (Almost Guaranteed)

These are warm-up questions. They set the tone. Nail them.

---

### Q1: Tell me about your project. What does it do?

> "I built a College ERP system — a full-stack web app that manages three roles: Admin, Faculty, and Student. Admins manage users, branches, subjects, notices, and exams. Faculty upload study materials, manage timetables, and enter student marks. Students view their marks, materials, and timetables. It's built with React on the frontend, Express.js + Node.js on the backend, and MongoDB as the database. Authentication is JWT-based with bcrypt password hashing."

**Follow-up they'll ask**: *What was the hardest part?*
> "The bulk marks upload — faculty submit marks for 60+ students at once. I had to implement an upsert pattern (find existing marks → update or create) to handle re-submissions. The initial implementation made 2N sequential database calls, which I know is a performance bottleneck. In production, I'd use MongoDB's `bulkWrite()` to batch it into one operation."

---

### Q2: What's the architecture? Walk me through the tech stack.

> "Monorepo with two directories — `frontend/` (React + Tailwind + Redux) and `backend/` (Express + Mongoose + JWT). The backend follows MVC: Models are Mongoose schemas, Controllers handle business logic, Routes define endpoints. The frontend uses React Router for role-based routing (`/admin/*`, `/faculty/*`, `/student/*`) and an Axios wrapper with a response interceptor for global error handling. MongoDB Atlas hosts the database, Vercel hosts the frontend, and Render hosts the backend."

---

### Q3: How does authentication work?

> "Email + password login. Backend finds the user, compares the password with bcrypt, generates a JWT with the user's MongoDB ObjectId (1-hour expiry), and returns it. Frontend stores the token in localStorage and sends it as a `Bearer` header on every request. The auth middleware on the backend verifies the token and injects `req.userId` for controllers to use. There's also a password reset flow using email — a short-lived JWT (10 min) stored in the database, sent via Nodemailer."

**Follow-up**: *Why JWT over sessions?*
> "JWT is stateless — the server doesn't store session data, which makes horizontal scaling easier. The tradeoff is you can't revoke a token before expiry without maintaining a blacklist."

---

### Q4: What security measures did you implement?

> "Passwords hashed with bcrypt (salt round 10), never returned in API responses via `.select('-password')`. JWT with expiry. CORS restricted to the frontend domain. Environment variables for secrets. Input validation for email and phone formats. Mongoose enum validation for fields like gender and status. Uniqueness checks before creating users."

**Follow-up**: *What's missing?*
> "Rate limiting on login and reset endpoints. Role verification in the auth middleware — currently any valid token can hit any endpoint. Registration endpoints are public (should require admin auth). No file type/size validation on uploads."

---

### Q5: What would you do differently if you rebuilt it?

> "Five things: (1) Single User model with a `role` field instead of three separate models — reduces code duplication. (2) Role-checking middleware instead of trusting frontend routing. (3) TypeScript for type safety. (4) Cloud storage (S3) for file uploads instead of local disk. (5) Proper pagination on all list endpoints."

---

## 🔴 Section 2: REST APIs & Backend (Core JD Requirement)

---

### Q6: What is a REST API? What principles does it follow?

> "REST (Representational State Transfer) is an architectural style for web services. Key principles: (1) Stateless — each request contains all info needed (like the JWT). (2) Resource-based URLs — `/api/students`, not `/api/getStudents`. (3) HTTP methods for actions — GET for read, POST for create, PATCH/PUT for update, DELETE for remove. (4) Consistent response format — in my project, every response has `{ success, message, data }`."

### Q7: What's the difference between PUT and PATCH?

> "PUT replaces the entire resource — you must send all fields. PATCH updates only the fields you send. In my project, user updates use PATCH because the frontend sends only changed fields (e.g., just the phone number)."

### Q8: How do you handle errors in your API?

> "I built an `ApiResponse` utility class with static factory methods like `.success()`, `.badRequest()`, `.unauthorized()`. Each returns an object with the correct status code, a `success` boolean (auto-computed from status code), a message, and data. The `.send(res)` method sends the response. This ensures every endpoint returns the same shape."

### Q9: What HTTP status codes have you used and when?

| Code | When | Example |
|------|------|---------|
| 200 | Success | Fetching user details |
| 201 | Created | Registering a new student |
| 400 | Bad request | Invalid email format |
| 401 | Unauthorized | Wrong password, expired token |
| 403 | Forbidden | (Should be used for) accessing another's material |
| 404 | Not found | User doesn't exist |
| 409 | Conflict | Duplicate email/phone |
| 500 | Server error | Database connection failure |

### Q10: What is middleware? How did you use it?

> "Middleware is a function that runs between receiving a request and sending a response. I used two: (1) **Auth middleware** — verifies JWT, extracts userId, attaches it to `req`. If invalid, returns 401 before the controller runs. (2) **Multer middleware** — handles `multipart/form-data` file uploads, saves files to disk, attaches file info to `req.file`."

### Q11: How do you validate incoming data?

> "Three layers: (1) Controller-level — regex for email, phone length, password min length. (2) Mongoose schema — `required: true`, `enum` for allowed values. (3) MongoDB — unique indexes catch duplicates the application layer misses. I'd add a validation library like Zod or Joi in production."

---

## 🔴 Section 3: React & Frontend (Core JD Requirement)

---

### Q12: What is the virtual DOM? How does React use it?

> "The virtual DOM is an in-memory representation of the real DOM. When state changes, React creates a new virtual DOM tree, diffs it with the previous one (reconciliation), and updates only the changed nodes in the real DOM. This is faster than manipulating the DOM directly."

### Q13: What are React hooks? Which ones did you use?

> "`useState` for form data and component state. `useEffect` for side effects like API calls on mount and checking if user is logged in. `useNavigate` for programmatic navigation. `useDispatch` and `useSelector` for Redux store interaction. `useSearchParams` for reading URL query parameters."

### Q14: What's the difference between `useEffect` with different dependency arrays?

```
useEffect(() => { ... }, []);         // Runs once on mount
useEffect(() => { ... }, [x]);        // Runs when x changes
useEffect(() => { ... });             // Runs on every render (avoid this)
```

> "In my Login component, I use `useEffect(() => { ... }, [navigate])` to check if the user is already logged in on mount and redirect them."

### Q15: How do you manage state in your app?

> "Two layers: **Redux** for global state (user token and user data) accessible across components, and **localStorage** for persistence across page refreshes. I used legacy Redux with `createStore`, actions, and reducers. For a new project, I'd use Redux Toolkit or even Zustand for simpler state needs."

### Q16: What is prop drilling and how do you avoid it?

> "Prop drilling is passing data through multiple levels of components that don't need it, just to reach a deeply nested component. I avoid it using Redux — any component can access the store directly via `useSelector` without receiving data through props."

### Q17: How do you handle forms in React?

> "Controlled components — each input's value is tied to state via `useState`, and `onChange` handlers update the state. On form submit, I prevent default, validate fields, and call the API. For file uploads, I use `FormData` because `application/json` can't carry binary data."

### Q18: What is React Router? How do you use it?

> "React Router (`react-router-dom` v6) handles client-side routing. I use `BrowserRouter` for HTML5 history API, `Routes`/`Route` for defining paths, `useNavigate` for programmatic navigation, and `Link` for anchor tags. I also have a `ProtectedRoute` wrapper that checks for a valid token before rendering authenticated pages."

---

## 🟡 Section 4: Database (PostgreSQL Focus, but You Know MongoDB)

---

### Q19: What database did you use and why?

> "MongoDB with Mongoose ODM. I chose it because user profiles (admin, faculty, student) have different structures, and MongoDB's flexible schemas handle this well. The data access pattern is mostly document-level (fetch one user, update one record), not heavy relational queries. That said, for the relational aspects (marks → student → subject → exam), PostgreSQL might have been a better fit."

### Q20: What's the difference between SQL and NoSQL?

| Aspect | SQL (PostgreSQL) | NoSQL (MongoDB) |
|--------|-----------------|----------------|
| Schema | Fixed, predefined tables | Flexible, schema-optional |
| Relationships | JOINs, foreign keys | References + `populate()` (app-level joins) |
| Transactions | ACID, multi-table | Limited (replica set required) |
| Scaling | Vertical (mostly) | Horizontal (sharding) |
| Query language | SQL | MongoDB query language / aggregation |
| Best for | Structured, relational data | Document-oriented, flexible data |

### Q21: How do you handle relationships in MongoDB?

> "Using ObjectId references and Mongoose's `populate()`. For example, a Student has `branchId` referencing the Branch collection. When I query a student and call `.populate('branchId')`, Mongoose replaces the ObjectId with the full Branch document. It's like a client-side JOIN — but it's N+1 queries under the hood."

### Q22: What is an ORM/ODM?

> "ORM (Object-Relational Mapping) maps database tables to objects in code. Mongoose is an ODM (Object-Document Mapping) for MongoDB — same concept but for documents. It provides schema definitions, validation, middleware hooks (like `pre('save')` for password hashing), and query helpers."

### Q23: Have you worked with PostgreSQL?

> "Not in this project, but I understand the fundamentals — tables, columns, primary/foreign keys, JOINs, indexes, SQL queries (SELECT, INSERT, UPDATE, DELETE), and transactions. If I were to rebuild this project with PostgreSQL, I'd use a single `users` table with a `role` column, and separate tables for marks, materials, etc. with foreign key constraints."

---

## 🟡 Section 5: Python & FastAPI (JD Core — Bridge from Your Express Knowledge)

---

### Q24: Do you know Python?

> "Yes, I'm comfortable with Python fundamentals — data structures, OOP, list comprehensions, decorators, and async/await. I've primarily used JavaScript for web development, but the concepts transfer directly. FastAPI's async route handlers are similar to Express's async controllers."

### Q25: What is FastAPI? How is it different from Express?

> "FastAPI is a modern Python web framework for building APIs. Key differences from Express:
> - **Type hints**: FastAPI uses Python type hints for automatic request validation and documentation
> - **Auto-generated docs**: Swagger UI and ReDoc come built-in at `/docs`
> - **Async-first**: Native `async/await` support with `asyncio`
> - **Pydantic models**: Define request/response schemas with automatic validation
> - **Performance**: One of the fastest Python frameworks (built on Starlette + Uvicorn)
>
> The MVC pattern from my Express project maps directly — FastAPI routers are like Express routers, dependency injection replaces middleware, and Pydantic models replace manual validation."

### Q26: How would your project look in FastAPI?

> "My Express auth middleware would become a FastAPI dependency. My `ApiResponse` class would become Pydantic response models. My Mongoose models would become SQLAlchemy models (with PostgreSQL). Route handlers would use `async def` instead of `async (req, res)`. Validation that I do manually (email regex, phone format) would be handled by Pydantic automatically."

---

## 🟡 Section 6: Async & Background Jobs (JD Mentions Celery, RabbitMQ, Redis)

---

### Q27: How do you handle asynchronous operations?

> "In my project, all database queries and API calls use `async/await`. Each controller is an `async` function with try-catch for error handling. I understand the event loop — Node.js is single-threaded but non-blocking for I/O. CPU-bound operations like bcrypt hashing DO block the event loop. For background jobs (like sending password reset emails), I'd use a task queue like Celery (Python) or Bull (Node.js) instead of doing it synchronously in the request handler."

### Q28: What is a message queue? Why would you use one?

> "A message queue (like RabbitMQ or Redis) decouples producers from consumers. Instead of sending an email synchronously during a request (blocking the response for 1-3 seconds), you push a 'send email' task to the queue and respond immediately. A background worker picks up the task and processes it asynchronously. This improves response times and reliability — if the email service is down, the task stays in the queue and retries."

### Q29: What is Celery?

> "Celery is a Python distributed task queue. You define tasks (functions), push them to a broker (RabbitMQ or Redis), and workers process them in the background. In my project's context, password reset email sending would be a Celery task — the API responds instantly, and the email is sent asynchronously."

---

## 🟡 Section 7: Git & Version Control

---

### Q30: What Git workflow do you follow?

> "Feature branching. `main` branch is production-ready. For each feature, I create a branch like `feature/marks-system`, make commits, and merge via pull request. I use `.gitignore` to exclude `node_modules/`, `.env`, and build files."

### Q31: What's the difference between `git merge` and `git rebase`?

> "Merge creates a merge commit preserving both branch histories. Rebase replays commits from one branch onto another, creating a linear history. I use merge for feature branches (preserves context) and rebase for keeping a feature branch up-to-date with main."

### Q32: How do you resolve merge conflicts?

> "Open the conflicted files, look for `<<<<<<<`, `=======`, `>>>>>>>` markers. Decide which changes to keep. Edit the file, remove markers, stage, and commit. VS Code has a built-in merge conflict resolver that makes this visual."

---

## 🟡 Section 8: Deployment & DevOps Basics

---

### Q33: How did you deploy your application?

> "Frontend on Vercel (static SPA with rewrite rules for client-side routing), backend on Render (Node.js web service), database on MongoDB Atlas. Environment variables store secrets. The backend can also serve the frontend build as a monolith."

### Q34: What is Docker? Have you used it?

> "Docker packages an application and its dependencies into a container — a lightweight, isolated environment that runs the same everywhere. I haven't used it in this project, but I understand the concept: a `Dockerfile` defines the image (base OS, install dependencies, copy code, start command), and `docker-compose` orchestrates multiple containers (frontend, backend, database). It solves the 'works on my machine' problem."

### Q35: What is CI/CD?

> "Continuous Integration: automatically running tests and builds on every code push. Continuous Deployment: automatically deploying passing builds to production. Tools: GitHub Actions, Jenkins, GitLab CI. A pipeline might be: push code → run linter → run tests → build → deploy to staging → deploy to production."

---

## 🟢 Section 9: General CS & Problem Solving

---

### Q36: What are the SOLID principles?

> **S** — Single Responsibility: Each controller handles one entity. 
> **O** — Open/Closed: ApiResponse can be extended (new static methods) without modifying existing ones.
> **L** — Liskov Substitution: Any ApiResponse subclass should work where ApiResponse is expected.
> **I** — Interface Segregation: Routes only import the controllers they need.
> **D** — Dependency Inversion: Controllers depend on Mongoose abstractions, not raw MongoDB driver.

### Q37: What is the difference between process and thread?

> "A process has its own memory space. A thread shares memory with other threads in the same process. Node.js runs on a single thread with an event loop for concurrency. Python can use multiple threads but the GIL (Global Interpreter Lock) limits true parallelism — that's why Celery uses separate processes."

### Q38: What is an event loop?

> "It's a mechanism that processes async operations on a single thread. Node.js checks for pending I/O callbacks, timers, and microtasks in phases. When `await` is called, the function suspends but the event loop continues processing other requests. This allows handling thousands of concurrent connections without one thread per connection."

### Q39: What is CORS and why is it needed?

> "Cross-Origin Resource Sharing. Browsers block requests from one domain to another by default (same-origin policy). CORS headers tell the browser which origins are allowed. In my project, the frontend (Vercel domain) calls the backend (Render domain), so I configure CORS on Express to allow the frontend's origin."

### Q40: What is the difference between cookies, localStorage, and sessionStorage?

| Feature | Cookies | localStorage | sessionStorage |
|---------|---------|-------------|----------------|
| Size | 4 KB | 5-10 MB | 5-10 MB |
| Sent with requests | ✅ Auto | ❌ Manual | ❌ Manual |
| Expiry | Configurable | Never | On tab close |
| XSS vulnerable | ❌ (httpOnly) | ✅ Yes | ✅ Yes |
| CSRF vulnerable | ✅ Yes | ❌ No | ❌ No |

> "I used localStorage because it persists across browser sessions and isn't automatically sent with requests (avoiding CSRF). The tradeoff is XSS vulnerability — a malicious script can read the token. In production, I'd use httpOnly cookies."

---

## 🟢 Section 10: Behavioral / Situational

---

### Q41: Tell me about a bug you spent a long time fixing.

> "The `pre('save')` hook not firing on `findByIdAndUpdate`. When I first implemented password updates, users couldn't log in with their new passwords. The password was being stored in plaintext because Mongoose middleware only fires on `.save()` and `.create()`, not on query-based updates. The fix was manually hashing the password with bcrypt before calling `findByIdAndUpdate`. Took me time to realize it because the code looked correct — the hook was defined, the password was being 'set'. The actual Mongoose behavior was the root cause."

### Q42: How do you learn a new technology?

> "I start with the official documentation to understand the core concepts. Then I build a small prototype — for FastAPI, I'd build a simple CRUD API to understand routing, Pydantic models, and dependency injection. Then I map new concepts to ones I already know — FastAPI routers ≈ Express routers, Pydantic ≈ Mongoose schemas, FastAPI dependencies ≈ Express middleware."

### Q43: Why do you want to work at Gocomet?

> *(Personalize this, but here's a template)*
> "I want to work with a production-grade tech stack — FastAPI, React, PostgreSQL, Celery, Redis. My College ERP project gave me strong fundamentals in full-stack development, but I want to experience how real-world systems handle scale, background processing, and graph databases. Gocomet's logistics focus means complex data relationships (routes, shipments, tracking) — exactly the kind of problem I find interesting."

### Q44: Where do you see yourself in 2 years?

> "Contributing to system design decisions, not just implementing features. I want to go from writing CRUD endpoints to designing how services communicate, how data flows through queues, and how to build systems that scale. This internship is the right step — learning FastAPI, Celery, and Neo4j alongside experienced developers."

---

## 🧠 Rapid-Fire Questions They Might Throw

| Question | Quick Answer |
|----------|-------------|
| What is JSON? | JavaScript Object Notation — a text-based data format for API communication |
| What is a Promise? | An object representing a future value — pending, fulfilled, or rejected |
| What is `async/await`? | Syntactic sugar over Promises for writing async code that looks synchronous |
| What does `npm install` do? | Reads `package.json`, downloads dependencies to `node_modules/` |
| What is `package-lock.json`? | Locks exact dependency versions for reproducible installs |
| What is `.env`? | File storing environment-specific secrets; never committed to Git |
| What is HTTPS? | HTTP + TLS encryption. Ensures data in transit is encrypted |
| What is a CDN? | Content Delivery Network — serves static files from servers close to users |
| What is JSON Web Token? | A signed, URL-safe token containing claims (user ID, expiry) |
| What is bcrypt? | Password hashing algorithm with built-in salt and adaptive cost factor |
| What is SQL injection? | Attacker injects SQL code via input fields to manipulate queries |
| What is NoSQL injection? | Same concept but with MongoDB operators (e.g., `{ "$gt": "" }` in login) |
| What is XSS? | Cross-Site Scripting — injecting malicious scripts into web pages |
| What is CSRF? | Cross-Site Request Forgery — tricking a user's browser into making unwanted requests |
| What is a 301 vs 302? | 301 = permanent redirect, 302 = temporary redirect |
| What is OAuth? | Authorization framework for third-party access (Google login, GitHub login) |

---

## 💡 Questions YOU Should Ask the Interviewer

1. "What does a typical day look like for this intern role?"
2. "What's the tech stack for the product I'd be working on?"
3. "How large is the engineering team?"
4. "What does the code review process look like?"
5. "Is there a mentorship structure for interns?"
6. "What's the deployment frequency — how often do you ship?"
