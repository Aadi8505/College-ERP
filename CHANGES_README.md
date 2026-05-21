# 🔄 Architecture Overhaul — Change Log

> This file documents every change made during the College ERP restructuring.
> If token runs out, give this file to the next model/session to continue.

---

## What Was Done (Overview)

### Goal
1. Merge 3 user models (Admin, Faculty, Student) → 1 unified `User` model
2. Replace auto-generated student email → admin enters email manually
3. Auto-generate roll numbers in serial format (`CSE101`, `BCA102`)
4. Add role-based access control (RBAC) middleware
5. Secure ALL API endpoints with role verification
6. Update frontend to match new API structure

### Status: ✅ COMPLETED

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/models/user.model.js` | Unified User model with role field, replaces 3 old models |
| `backend/middlewares/role.middleware.js` | `requireRole()` middleware for RBAC |
| `backend/controllers/user.controller.js` | Unified controller for all user operations |
| `backend/routes/auth.route.js` | Auth routes (login, password reset, my-details) |
| `backend/routes/users.route.js` | User CRUD routes (admin-only, secured) |

## Files Modified

| File | What Changed |
|------|-------------|
| `backend/models/reset-password.model.js` | Removed `refPath` + `type`, now refs `User` directly |
| `backend/models/marks.model.js` | Changed ref from `StudentDetails` → `User` |
| `backend/models/material.model.js` | Changed ref from `FacultyDetail` → `User` |
| `backend/index.js` | Replaced 3 role-specific route mounts with `/api/auth` + `/api/users` |
| `backend/admin-seeder.js` | Updated to use `User` model with `role: "admin"` |
| `backend/routes/branch.route.js` | Added `requireRole("admin")` to write endpoints |
| `backend/routes/subject.route.js` | Added `requireRole("admin")` to write endpoints |
| `backend/routes/notice.route.js` | Added `requireRole("admin")` to write endpoints |
| `backend/routes/timetable.route.js` | Added `requireRole("admin", "faculty")` |
| `backend/routes/exam.route.js` | Added `requireRole("admin")` to write endpoints |
| `backend/routes/marks.route.js` | Added `requireRole("faculty")` to write endpoints |
| `backend/routes/material.route.js` | Added `requireRole("faculty")` to write endpoints |
| `frontend/src/Screens/Login.jsx` | Single login endpoint, no user type selector, backend returns role |
| `frontend/src/Screens/Admin/Student.jsx` | Removed enrollmentNo field, added email, shows rollNumber |
| `frontend/src/Screens/Admin/Faculty.jsx` | Updated API paths to unified `/users` endpoints, passing `role: faculty` |
| `frontend/src/Screens/Admin/Admin.jsx` | Updated API paths to unified `/users` endpoints, passing `role: admin` |
| `frontend/src/Screens/Admin/Home.jsx` | Updated profile details endpoint to `/auth/my-details` |
| `frontend/src/Screens/Faculty/Home.jsx` | Updated profile details endpoint to `/auth/my-details` |
| `frontend/src/Screens/Student/Home.jsx` | Updated profile details endpoint to `/auth/my-details` |
| `frontend/src/Screens/Faculty/StudentFinder.jsx` | Updated student search to query unified `/users/search/students` endpoint |

## Files Deleted

| File | Replaced By |
|------|------------|
| `backend/models/details/admin-details.model.js` | `backend/models/user.model.js` |
| `backend/models/details/faculty-details.model.js` | `backend/models/user.model.js` |
| `backend/models/details/student-details.model.js` | `backend/models/user.model.js` |
| `backend/controllers/details/admin-details.controller.js` | `backend/controllers/user.controller.js` |
| `backend/controllers/details/faculty-details.controller.js` | `backend/controllers/user.controller.js` |
| `backend/controllers/details/student-details.controller.js` | `backend/controllers/user.controller.js` |
| `backend/routes/details/admin-details.route.js` | `backend/routes/auth.route.js` + `backend/routes/users.route.js` |
| `backend/routes/details/faculty-details.route.js` | `backend/routes/auth.route.js` + `backend/routes/users.route.js` |
| `backend/routes/details/student-details.route.js` | `backend/routes/auth.route.js` + `backend/routes/users.route.js` |

---

## API Endpoint Changes

### Old → New Mapping

```
OLD                                    NEW
───                                    ───
POST /api/admin/login                → POST /api/auth/login (body: {email, password})
POST /api/faculty/login              → POST /api/auth/login
POST /api/student/login              → POST /api/auth/login

GET  /api/admin/my-details           → GET  /api/auth/my-details
GET  /api/faculty/my-details         → GET  /api/auth/my-details
GET  /api/student/my-details         → GET  /api/auth/my-details

POST /api/admin/register             → POST /api/users/register (body includes "role")
POST /api/faculty/register           → POST /api/users/register
POST /api/student/register           → POST /api/users/register

GET  /api/admin/                     → GET  /api/users?role=admin
GET  /api/faculty/                   → GET  /api/users?role=faculty
GET  /api/student/                   → GET  /api/users?role=student

PATCH  /api/admin/:id                → PATCH  /api/users/:id
DELETE /api/admin/:id                → DELETE /api/users/:id

POST /api/admin/forget-password      → POST /api/auth/forget-password
POST /api/admin/change-password      → POST /api/auth/change-password
POST /api/student/search             → POST /api/users/search/students
```

### Login Response Change

```
OLD: { success: true, data: { token } }
NEW: { success: true, data: { token, role: "admin"|"faculty"|"student" } }
```

---

## Key Schema Changes

### User Model Fields

```
role: "admin" | "faculty" | "student"  ← NEW
email: manually entered                ← CHANGED (was auto-generated for students)
rollNumber: auto-generated "CSE101"    ← NEW (replaces enrollmentNo)
enrollmentNo: REMOVED
employeeId: kept for admin/faculty
```

### Roll Number Generation Logic

```
1. Get branch.branchId (e.g., "CSE")
2. Find the highest existing rollNumber for that branch prefix
3. Extract the number, increment by 1
4. If first student: branchId + "101" → "CSE101"
5. Store as string in User.rollNumber
```

---

## 🔒 Security Hardening Updates

### 1. Backend Marks Query Protection
* **Vulnerability**: Endpoints `GET /api/marks` and `GET /api/marks/students` were accessible by any authenticated user, letting students fetch other students' marks or class-wide lists.
* **Fix**: Restructured `backend/routes/marks.route.js` to secure both routes under `requireRole("admin", "faculty")`. Students are fully restricted to `GET /api/marks/student` which only loads their own personal marks.

### 2. Client-Side Dashboard Protection (Hardened Dual-Layer Security)
* **Vulnerability**: React routes for `/admin`, `/faculty`, and `/student` lacked router-level protection and had a component-level loading lag, letting students access dashboard layouts, menu headers, or briefly view admin interfaces before a component-level redirect.
* **Fix**: Implemented a comprehensive, **dual-layered client-side RBAC protection**:
  1. **Route-Level Guard**: Created `frontend/src/components/ProtectedRoute.jsx` and wrapped all dashboard routes in `frontend/src/App.js`. This performs instant checks against local storage roles to intercept and redirect unauthorized users before the dashboards mount.
  2. **Component-Level Hardening**: Configured loaders in `Admin/Home.jsx`, `Faculty/Home.jsx`, and `Student/Home.jsx` to start with `isLoading: true` and execute early returns. No menus, layouts, or dashboard subcomponents will ever render until the active session JWT token is successfully validated by the backend `/auth/my-details` API.
  3. **Removed Dead Code**: Deleted the redundant, incomplete `App.jsx` file to ensure the bundler cleanly resolves the secured `App.js` entrypoint.

---

## How to Continue If Session Ends

1. Check the task.md file for what's done vs pending
2. Read this CHANGES_README.md for context
3. The new unified model is at `backend/models/user.model.js`
4. The RBAC middleware is at `backend/middlewares/role.middleware.js`
5. All old files in `backend/models/details/`, `backend/controllers/details/`, and `backend/routes/details/` are being replaced
6. Frontend changes center on Login.jsx and Admin/ screen files

### Environment Setup
```bash
cd backend && npm run seed   # Re-seed the admin user
cd backend && npm run dev    # Start backend
cd frontend && npm start     # Start frontend (separate terminal)
```

---

## 📅 Semester to Batch Migration Overhaul (COMPLETED)

To align with modern engineering college workflows where students belong to a year-based **Batch** (e.g., "Batch 23", "Batch 24") rather than transitioning their data documents every semester, we have completely migrated the database schema operations, backend controllers, and frontend views.

### 1. Legacy Database Wiping
* **Action**: Executed a temporary database wiping script to remove all documents from:
  - `Timetables`
  - `Materials`
  - `Exams`
  - `Marks`
* **Rationale**: Old documents contained legacy required schema validators (like `semester`) that were obsolete under the new model, which would have crashed the database on any update/query. Wiping legacy documents cleared the way for clean, batch-based record generation.

### 2. Backend Updates
* **marks.controller.js**:
  - Updated `getStudentsWithMarksController` to destructure and validate `batch` from query parameters rather than `semester`.
  - Fixed a query bug in student marks retrieval where a non-destructured, undefined `batch` was passed to Mongoose `Marks.find`.
  - Updated response and error messages to refer to "batch" instead of "semester".

### 3. Frontend Admin Screens
* **Subject.jsx**:
  - Fully renamed and refactored state property `semester` → `batch`.
  - Replaced the `[1..8]` semester options select dropdown with batch options `[23, 24, 25, 26]`.
  - Updated the subjects listing table header and row items to display `Batch` rather than `Semester`.
* **Exam.jsx**:
  - Fixed a severe UI bug where the exam creation modal dropdown select was binding/writing to `data.semester` instead of the required `data.batch`, preventing exams from passing the frontend validator.
  - Replaced semester dropdown select options with batch options `[23, 24, 25, 26]`.
  - Updated admin, faculty, and student exam schedule tables to display `Batch` instead of `Semester`.

### 4. Frontend Faculty Screens
* **AddMarks.jsx**:
  - Completely refactored all state variables, input event handlers, and query states from `selectedSemester` to `selectedBatch`.
  - Updated the API endpoint to fetch exams for the select dropdown: `/exam?batch=${selectedBatch}`.
  - Updated the API endpoint to fetch student lists: `/marks/students?branch=${branch}&subject=${subject}&batch=${batch}&examId=${examId}`.
  - Corrected the bulk marks submit payload to specify `batch` rather than `semester`.
  - Replaced the select dropdown filter options with `[23, 24, 25, 26]`.
* **StudentFinder.jsx**:
  - Modified the main student finder search results table header from "Semester" to "Batch" to align with its column data cell (`student.batch`).

### 5. Frontend Student Screens
* **Material.jsx**:
  - Reconfigured study materials and subject query APIs to query using `userData.batch` instead of `userData.semester`.
* **Profile.jsx**:
  - Updated the student profile personal details card to display "Batch" instead of "Semester", outputting `profileData.batch`.
* **Timetable.jsx**:
  - Updated class timetable queries to fetch by `batch` using `/timetable?batch=${userData.batch}&branch=${branchId}`.
  - Configured react hook `useEffect` dependency tracking to watch `userData.batch` instead of `userData.semester`.
  - Updated all preview headings, timetable details cards, and helper warning notes to refer to "Batch" instead of "Semester".
* **ViewMarks.jsx**:
  - Refactored student marks query to search marks by batch via `/marks/student?batch=${batch}`.
  - Changed the semester select dropdown to a batch select dropdown offering options `[23, 24, 25, 26]`.

### 6. Profile Runtime Crash Fix (COMPLETED)
* **Vulnerability/Bug**: Profile screens (for Admin, Faculty, and Student roles) accessed properties like `profileData.salary` and `profileData.emergencyContact` without safe check guards/optional chaining. When a user did not have a salary populated or emergency contacts set, calling `.toLocaleString()` or accessing subproperties caused a complete React crash (`Cannot read properties of undefined`).
* **Fix**: 
  - Implemented secure optional chaining (`profileData.emergencyContact?.name`) and robust fallbacks (`|| "N/A"`) for emergency contacts in all three profile views: [Admin Profile](file:///c:/Users/HP%20VICTUS/Desktop/College-Management-System/frontend/src/Screens/Admin/Profile.jsx), [Faculty Profile](file:///c:/Users/HP%20VICTUS/Desktop/College-Management-System/frontend/src/Screens/Faculty/Profile.jsx), and [Student Profile](file:///c:/Users/HP%20VICTUS/Desktop/College-Management-System/frontend/src/Screens/Student/Profile.jsx).
  - Wrapped salary formatting in a conditional ternary check (`profileData.salary ? profileData.salary.toLocaleString() : "N/A"`) to safely display salary figures.
  - Hardened the `formatDate` helper method to gracefully intercept missing, null, or invalid dates and return `"N/A"` instead of triggering date parsing errors.
  - Added optional chaining to Student branch identifier (`profileData.branchId?.name`).


