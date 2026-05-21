# 🎯 College ERP — Interview Preparation Guide

> A structured study plan to master every technical decision in this MERN stack College Management System so you can confidently explain and defend it in interviews.

---

## 📚 Study Order (Recommended)

Follow this sequence — each topic builds on the previous:

| # | File | Topic | Priority | Time |
|---|------|-------|----------|------|
| 1 | `01-architecture-overview.md` | System Architecture & Project Structure | 🔴 Critical | 20 min |
| 2 | `02-database-design.md` | MongoDB Schema Design & Relationships | 🔴 Critical | 25 min |
| 3 | `03-authentication-and-authorization.md` | JWT Auth, Password Hashing, Reset Flow | 🔴 Critical | 30 min |
| 4 | `04-api-design-and-data-flow.md` | REST API Design, Request Lifecycle | 🔴 Critical | 25 min |
| 5 | `05-state-management.md` | Redux Store, Token Persistence, Axios Interceptors | 🟡 Important | 15 min |
| 6 | `06-file-upload-handling.md` | Multer, Static File Serving, Profile Images | 🟡 Important | 15 min |
| 7 | `07-role-based-access-control.md` | Multi-Role System, Route Protection, Notice Filtering | 🔴 Critical | 20 min |
| 8 | `08-business-logic.md` | Marks, Materials, Timetables, Exams, Student Search | 🟡 Important | 20 min |
| 9 | `09-security-practices.md` | Input Validation, CORS, Environment Variables, XSS | 🔴 Critical | 20 min |
| 10 | `10-error-handling.md` | ApiResponse Pattern, Centralized Error Handling | 🟡 Important | 15 min |
| 11 | `11-async-patterns.md` | async/await, Promise Handling, Race Conditions | 🟡 Important | 15 min |
| 12 | `12-deployment-and-devops.md` | Render, Vercel, SPA Routing, Build Process | 🟢 Good to Know | 15 min |
| 13 | `13-performance-and-scalability.md` | Indexing, Query Optimization, N+1, Caching | 🟢 Good to Know | 15 min |
| 14 | `14-edge-cases-and-gotchas.md` | Known Pitfalls, Boundary Conditions, Failure Modes | 🟡 Important | 15 min |
| 15 | `15-gocomet-interview-questions.md` | JD-Mapped Questions (Project, React, APIs, Python, Behavioral) | 🔴 Critical | 40 min |
| 16 | `16-new-tech-crash-course.md` | FastAPI, Redis, RabbitMQ, Celery, Neo4j, Docker, CI/CD | 🔴 Critical | 45 min |

**Total estimated study time: ~5.5 hours**

---

## 🔴 Most Important Topics (Must Know)

These will come up in almost every interview:

1. **Architecture** — MVC pattern, monorepo structure, client-server separation
2. **Authentication** — JWT lifecycle, bcrypt hashing, `pre('save')` hook, token expiry
3. **API Design** — RESTful conventions, consistent response format (ApiResponse class)
4. **Database** — Mongoose schemas, `ObjectId` references, `populate()`, uniqueness constraints
5. **Security** — Password never returned to client, CORS config, input validation, env variables
6. **Role-Based Access** — Three separate user models, per-role login endpoints, notice type filtering

---

## 🧠 Hardest Concepts (Spend Extra Time)

| Concept | Why It's Hard | File |
|---------|--------------|------|
| Password Reset Flow | Multi-step JWT + DB token + email + expiry | `03-authentication-and-authorization.md` |
| Three Separate User Models | Unusual design — you must justify vs. single User model | `02-database-design.md` |
| `pre('save')` Hook Gotcha | Doesn't fire on `findByIdAndUpdate` — manual hashing needed | `03-authentication-and-authorization.md` |
| Bulk Marks Upsert | Sequential DB calls inside a loop, no transactions | `08-business-logic.md` |
| AxiosWrapper Interceptor | Global token expiry detection and auto-logout | `05-state-management.md` |
| Material Ownership Check | Faculty can only edit/delete their own uploads | `07-role-based-access-control.md` |

---

## ⚡ Last-Minute Revision Checklist

### Architecture
- [ ] MERN stack: React (CRA) + Express + MongoDB (Mongoose) + Node.js
- [ ] Monorepo with `/backend` and `/frontend` — not a monolith
- [ ] Backend serves React build in production (catch-all `*` route)
- [ ] API routes mounted before static files (order matters!)

### Authentication
- [ ] JWT with `userId` claim, 1-hour expiry
- [ ] bcrypt with salt round 10
- [ ] `pre('save')` hook — only fires on `.create()` and `.save()`, NOT on `findByIdAndUpdate`
- [ ] Password reset: JWT inside DB record → email link → verify + update
- [ ] Token sent as `Bearer <token>` in `Authorization` header
- [ ] `select("-password -__v")` on every user query

### API Design
- [ ] `ApiResponse` class with static factory methods (`.success()`, `.badRequest()`, etc.)
- [ ] Chainable `.send(res)` pattern
- [ ] Consistent `{ success, message, data }` response shape
- [ ] Login is `POST /:role/login` — role-specific endpoints

### Database
- [ ] Three user models: AdminDetail, FacultyDetail, StudentDetail
- [ ] `branchId` as ObjectId ref on Faculty and Student
- [ ] Subject scoped by branch + semester
- [ ] Marks references: studentId, subjectId, examId
- [ ] `refPath` on ResetPassword for polymorphic reference

### Security
- [ ] Password never sent to frontend (`.select("-password")`)
- [ ] Default passwords on registration: `admin123`, `faculty123`, `student123`
- [ ] CORS restricted to `FRONTEND_API_LINK`
- [ ] No rate limiting (know this as a weakness)
- [ ] No RBAC middleware — endpoints trust the auth token type

### Frontend
- [ ] Redux for global state (userData, userToken)
- [ ] `localStorage` for token persistence across refreshes
- [ ] AxiosWrapper interceptor auto-clears token on 401
- [ ] Role-based routing: `/admin/*`, `/faculty/*`, `/student/*`
- [ ] TailwindCSS for styling
- [ ] `react-hot-toast` for notifications

### Deployment
- [ ] Backend on Render (render.yaml)
- [ ] Frontend on Vercel (vercel.json with SPA rewrites)
- [ ] Environment variables for all secrets
- [ ] `npm run seed` to create initial super admin

---

## 💡 How to Use These Docs

1. **First pass**: Read each file top-to-bottom in study order
2. **Second pass**: Focus on "Interview Questions" sections — try answering without looking
3. **Third pass**: Review "Edge Cases" and "What Could Break" sections
4. **Before interview**: Run through the checklist above

> **Pro tip**: If asked "tell me about your project", start with Architecture → Auth → API Design → Database. This covers 70% of follow-up questions.

---

## 📂 Project Tech Stack Quick Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2 |
| Styling | TailwindCSS | 3.2 |
| State | Redux (legacy) | 4.2 |
| Routing | React Router DOM | 6.3 |
| HTTP Client | Axios | 1.3 |
| Notifications | react-hot-toast | 2.4 |
| Backend | Express.js | 4.18 |
| Database | MongoDB (Mongoose) | 7.0 |
| Auth | JWT + bcryptjs | 9.0 / 3.0 |
| File Upload | Multer | 1.4 |
| Email | Nodemailer | 8.0 |
| Dev Server | Nodemon | 3.1 |
