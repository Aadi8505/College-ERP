# 04 — API Design & Data Flow

## What This Covers

RESTful API design, the request-response lifecycle, the `ApiResponse` pattern, route organization, how data flows from frontend form to database and back.

---

## API Route Map

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| **Admin** ||||
| POST | `/api/admin/login` | ❌ | Admin login |
| POST | `/api/admin/register` | ❌* | Register new admin (file upload) |
| GET | `/api/admin/` | ✅ | Get all admins |
| GET | `/api/admin/my-details` | ✅ | Get logged-in admin's profile |
| PATCH | `/api/admin/:id` | ✅ | Update admin (file upload) |
| DELETE | `/api/admin/:id` | ✅ | Delete admin |
| POST | `/api/admin/forget-password` | ❌ | Send reset email |
| POST | `/api/admin/update-password/:resetId` | ❌ | Reset password via token |
| POST | `/api/admin/change-password` | ✅ | Change password while logged in |
| **Faculty** ||||
| POST | `/api/faculty/login` | ❌ | Faculty login |
| POST | `/api/faculty/register` | ❌* | Register faculty |
| GET | `/api/faculty/` | ✅ | Get all faculty |
| GET | `/api/faculty/my-details` | ✅ | Get logged-in faculty's profile |
| PATCH | `/api/faculty/:id` | ✅ | Update faculty |
| DELETE | `/api/faculty/:id` | ✅ | Delete faculty |
| **Student** ||||
| POST | `/api/student/login` | ❌ | Student login |
| POST | `/api/student/register` | ❌* | Register student |
| GET | `/api/student/` | ✅ | Get all students |
| GET | `/api/student/my-details` | ✅ | Get logged-in student's profile |
| PATCH | `/api/student/:id` | ✅ | Update student |
| DELETE | `/api/student/:id` | ✅ | Delete student |
| POST | `/api/student/search` | ✅ | Search students by filters |
| **Academic** ||||
| GET/POST/PUT/DELETE | `/api/branch/*` | Mixed | Branch CRUD |
| GET/POST/PUT/DELETE | `/api/subject/*` | Mixed | Subject CRUD |
| GET/POST/PUT/DELETE | `/api/notice/*` | Mixed | Notice CRUD |
| GET/POST/PUT/DELETE | `/api/timetable/*` | ✅ | Timetable CRUD (file upload) |
| GET/POST/PUT/DELETE | `/api/material/*` | ✅ | Material CRUD (file upload) |
| GET/POST/DELETE | `/api/marks/*` | ✅ | Marks management |
| GET/POST | `/api/exam/*` | Mixed | Exam management |

*\* Registration endpoints don't require auth — this is a design note discussed in Security.*

---

## Request Lifecycle (End-to-End)

### Example: Student Login

```
Frontend (Login.jsx)                    Backend (Express)
─────────────────────                   ─────────────────

1. User fills form
2. handleSubmit() fires
3. axiosWrapper.post(                   
     "/student/login",        ──────►  4. Route: POST /api/student/login
     { email, password }               5. No auth middleware (public)
   )                                   6. loginStudentController()
                                       7. studentDetails.findOne({email})
                                       8. bcrypt.compare(password, hash)
                                       9. jwt.sign({userId: user._id})
                              ◄──────  10. ApiResponse.success({token})
11. response.data.data.token
12. localStorage.setItem("userToken")
13. dispatch(setUserToken(token))
14. navigate("/student")
```

### Example: Authenticated Request (Get My Details)

```
Frontend                                Backend
────────                                ───────

1. Component mounts
2. axiosWrapper.get(
     "/student/my-details",   ──────►  3. auth middleware:
     { headers: {                         - Extract Bearer token
       Authorization:                     - jwt.verify() → decoded.userId
         "Bearer eyJ..."                  - req.userId = decoded.userId
     }}                                   - next()
   )                                   4. getMyDetailsController()
                                       5. studentDetails.findById(req.userId)
                                            .select("-password -__v")
                                            .populate("branchId")
                              ◄──────  6. ApiResponse.success(user)
7. setData(response.data.data)
8. Render profile UI
```

---

## The ApiResponse Pattern

### What It Does

A class that standardizes ALL API responses into a consistent format:

```json
{
  "success": true,
  "message": "Student Details Found!",
  "data": { ... }
}
```

### How It Works

```js
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;  // Auto-computed from status code
  }

  // Static factory methods
  static success(data, message) { return new ApiResponse(200, data, message); }
  static created(data, message) { return new ApiResponse(201, data, message); }
  static badRequest(message) { return new ApiResponse(400, null, message); }
  static unauthorized(message) { return new ApiResponse(401, null, message); }
  // ... more

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}
```

### Why This Pattern?

1. **Consistency**: Frontend can always expect `{ success, message, data }` — simplifies error handling
2. **Chainable**: `ApiResponse.success(data).send(res)` reads like English
3. **Prevents mistakes**: Developers can't accidentally return `{ error: true }` in one place and `{ status: "error" }` in another
4. **Status code + body alignment**: `success` field auto-computed from `statusCode` — no mismatch possible

### Alternative: Plain `res.json()`

Some controllers (notably `marks.controller.js`) use raw `res.json()` instead of `ApiResponse`. This inconsistency means the frontend must handle two response formats. A real-world codebase would enforce the pattern via code reviews.

---

## RESTful Design Decisions

### HTTP Methods Used

| Method | Meaning | Example |
|--------|---------|---------|
| GET | Read data | `GET /api/student/` |
| POST | Create new resource | `POST /api/student/register` |
| PATCH | Partial update | `PATCH /api/student/:id` |
| PUT | Full replace | `PUT /api/material/:id` |
| DELETE | Remove resource | `DELETE /api/student/:id` |

**Why PATCH over PUT for user updates?** PATCH sends only changed fields. PUT would require sending the entire user object, even unchanged fields. This matters for forms where users edit one field at a time.

**Exception**: Material uses PUT, meaning you should send all fields. This is a minor API inconsistency.

### URL Design

```
/api/{role}/{action}       ← Role-specific routes
/api/{resource}            ← Shared resource routes
/api/{resource}/:id        ← Resource by ID
```

**Good**: Clear hierarchy, predictable URLs.
**Unusual**: Login/register/forget-password live under the role prefix instead of a shared `/api/auth` endpoint. This keeps routes simple but duplicates the pattern.

---

## Data Validation Strategy

The project validates at three levels:

### 1. Controller-Level Validation

```js
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return ApiResponse.badRequest("Invalid email format").send(res);
}
if (!/^\d{10}$/.test(phone)) {
  return ApiResponse.badRequest("Phone number must be 10 digits").send(res);
}
```

### 2. Mongoose Schema Validation

```js
gender: { type: String, required: true, enum: ["male", "female", "other"] }
```

### 3. MongoDB-Level Constraints

```js
branchId: { type: String, required: true, unique: true }
```

### Why layered validation?

- Controller-level gives **user-friendly error messages** ("Phone must be 10 digits")
- Schema-level catches what controllers miss (a controller bug skipping validation)
- DB-level prevents data corruption as a last resort

---

## Query Patterns

### Dynamic Query Building (Material Controller)

```js
const { subject, faculty, semester, branch, type } = req.query;
let query = {};
if (subject) query.subject = subject;
if (faculty) query.faculty = faculty;
if (semester) query.semester = semester;
// ... only add filters that are provided
const materials = await Material.find(query);
```

**Why**: Flexible filtering without separate endpoints. Frontend can filter by any combination of parameters.

### Uniqueness Check Before Create

```js
const existing = await facultyDetails.findOne({ $or: [{ phone }, { email }] });
if (existing) {
  return ApiResponse.conflict("Faculty with these details already exists").send(res);
}
```

**Why `$or`**: Checks both phone AND email in one query instead of two separate queries.

### Exclude Self on Update

```js
const existing = await adminDetails.findOne({
  _id: { $ne: req.params.id },
  email: email,
});
```

**Why `$ne`**: When updating, the current user's own email shouldn't trigger a "already exists" error.

---

## What Could Break If Changed

1. **Remove `return` before `ApiResponse`** → Controller continues executing after sending error response, causing "headers already sent" crash
2. **Change response shape** → Frontend code like `response.data.data.token` breaks
3. **Remove `select("-password")` ** → Passwords leak to frontend
4. **Switch PATCH to PUT** → Existing frontend code that sends partial updates breaks
5. **Remove middleware order** → `auth` must come before `upload` in some routes for `req.userId` to be available

---

## Most Likely Interview Questions

**Q: How did you design your REST API?**
> I followed RESTful conventions: GET for reading, POST for creating, PATCH for partial updates, DELETE for removing. All responses follow a consistent `{ success, message, data }` format using an ApiResponse utility class. Routes are organized by role for user management and by resource for academic features.

**Q: What's the ApiResponse class and why did you build it?**
> It's a utility class with static factory methods like `.success()`, `.badRequest()`, `.unauthorized()`. It ensures every endpoint returns the same response shape, making frontend error handling predictable. The `.send(res)` method sets the HTTP status code and sends the JSON response in one call.

**Q: How does the frontend communicate with the backend?**
> Through an Axios instance (AxiosWrapper) configured with the base API URL. All requests go through this instance, which has a response interceptor that automatically clears the auth token and redirects to login if a 401 is received. For authenticated requests, the token is read from localStorage and sent as a Bearer header.

**Q: Why did you use PATCH instead of PUT?**
> PATCH is semantically correct for partial updates — the frontend only sends the fields that changed. PUT implies replacing the entire resource, which would require sending all fields even if only one was modified.

---

## Cross/Follow-up Questions

- *How would you version your API?* → Add `/v1/` prefix to all routes. Create a new route set for `/v2/` when breaking changes are needed.
- *Why not use GraphQL?* → Simple CRUD operations don't benefit from GraphQL's query flexibility. REST is simpler, better documented, and sufficient for this use case.
- *How do you handle pagination?* → Currently not implemented (a weakness). Would add `?page=1&limit=10` params with `skip()` and `limit()` on queries.
- *What about API documentation?* → Not implemented. Would add Swagger/OpenAPI or use Postman collections.

---

## Why This Implementation Matters

API design is a **fundamental backend skill**. Interviewers look for:
- Understanding of HTTP methods and status codes
- Consistency in response formatting
- Proper error handling
- Knowledge of REST principles and when to deviate

---

## Common Mistakes / Edge Cases

1. **Missing Content-Type header**: File uploads need `multipart/form-data`, not `application/json` — multer handles this but only when configured
2. **URL encoding**: Special characters in search queries need proper encoding. The branch search uses `$regex` which could be exploited
3. **Empty arrays vs 404**: Some controllers return 404 for empty results; others return 200 with empty array. The marks controller does it right (200 + empty array).
4. **ID format**: Invalid MongoDB ObjectIds cause `CastError` — not all controllers handle this gracefully
5. **Request body on GET**: The student search uses `POST` with body for filters. `GET` with query params would be more RESTful.
