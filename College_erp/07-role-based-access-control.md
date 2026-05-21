# 07 — Role-Based Access Control (RBAC)

## What This Covers

The three-role system (Admin, Faculty, Student), how access is controlled through route design, notice filtering by role, material ownership enforcement, and what's missing from a true RBAC implementation.

---

## The Role System

```
                    ┌─────────────┐
                    │   Admin     │
                    │ (SuperUser) │
                    └──────┬──────┘
                           │ can manage
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌───────────────┐
        │ Faculty  │ │ Student  │ │ Branches,     │
        │          │ │          │ │ Subjects,     │
        └────┬─────┘ └────┬─────┘ │ Notices, Exams│
             │             │       └───────────────┘
             │             │
        can manage    can view
             │             │
        ┌────▼─────┐ ┌────▼─────┐
        │Materials │ │ Marks    │
        │Timetables│ │Materials │
        │  Marks   │ │Timetables│
        └──────────┘ └──────────┘
```

### Role Permissions Matrix

| Feature | Admin | Faculty | Student |
|---------|-------|---------|---------|
| Manage Admins | ✅ CRUD | ❌ | ❌ |
| Manage Faculty | ✅ CRUD | ❌ | ❌ |
| Manage Students | ✅ CRUD | ✅ Search/View | ❌ |
| Manage Branches | ✅ CRUD | ❌ | ❌ |
| Manage Subjects | ✅ CRUD | ❌ | ❌ |
| Manage Notices | ✅ CRUD | ❌ | ❌ |
| Manage Exams | ✅ CRUD | ❌ | ❌ |
| Upload Materials | ❌ | ✅ Own materials | ❌ |
| View Materials | ❌ | ✅ All | ✅ Own branch/semester |
| Upload/Edit Marks | ❌ | ✅ | ❌ |
| View Marks | ❌ | ✅ All students | ✅ Own marks only |
| Manage Timetables | ❌ | ✅ CRUD | ❌ |
| View Timetables | ❌ | ✅ | ✅ Own branch/semester |
| View Profile | ✅ Own | ✅ Own | ✅ Own |
| Change Password | ✅ | ✅ | ✅ |

---

## How Access Control is Implemented

### 1. Route-Level Separation (Implicit RBAC)

Each role has its own route prefix and controller:

```
/api/admin/*    → admin-details.controller.js   → AdminDetail model
/api/faculty/*  → faculty-details.controller.js → FacultyDetail model  
/api/student/*  → student-details.controller.js → StudentDetail model
```

The **frontend** determines which routes to call based on the user type stored in localStorage:

```js
const response = await axiosWrapper.post(
  `/${selected.toLowerCase()}/login`,  // "/admin/login", "/faculty/login", etc.
  formData
);
```

### 2. Frontend Route Protection

```jsx
// App.jsx - Role-based route nesting
<Route path="/admin" element={
  <ProtectedRoute>
    <AdminLayout><Dashboard /></AdminLayout>
  </ProtectedRoute>
} />

<Route path="/faculty" element={
  <ProtectedRoute>
    <FacultyLayout><Dashboard /></FacultyLayout>
  </ProtectedRoute>
} />
```

**How `ProtectedRoute` works**: Checks if a token exists in localStorage. If not, redirects to login.

**What `AdminLayout` / `FacultyLayout` do**: Render role-specific navigation menus (sidebar links differ per role).

### 3. Auth Middleware (Backend)

```js
const auth = async (req, res, next) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.userId = decoded.userId;
  next();
};
```

**What it does**: Verifies the JWT is valid and extracts `userId`.

**What it does NOT do**: Check which role the user belongs to. The middleware trusts that the frontend routed the user correctly.

---

## The Critical Gap: No Backend Role Verification

This is the **most important weakness** to understand for interviews:

### The Problem

A student with a valid JWT can call `/api/admin/` (get all admins) because:
1. The auth middleware only checks if the token is valid
2. It doesn't verify that `req.userId` corresponds to an admin
3. The route doesn't check the user's role

### Exploitation Scenario

```
1. Student logs in → gets JWT with { userId: "student123" }
2. Student calls GET /api/admin/ with their valid JWT
3. Auth middleware says "valid token" → passes
4. Controller runs getAllDetailsController() → returns all admins
5. Student sees admin data they shouldn't
```

### Why It Still "Works"

The frontend only shows appropriate UI for each role. A student never sees the "Manage Admins" button. But a technical user with Postman could access any authenticated endpoint.

### How to Fix (Know This for Interviews)

```js
// Role-checking middleware
const requireRole = (role) => async (req, res, next) => {
  const Model = role === 'admin' ? AdminDetail 
    : role === 'faculty' ? FacultyDetail 
    : StudentDetail;
  
  const user = await Model.findById(req.userId);
  if (!user) {
    return ApiResponse.forbidden("Access denied").send(res);
  }
  req.userRole = role;
  next();
};

// Usage in routes:
router.get("/", auth, requireRole("admin"), getAllDetailsController);
```

---

## Notice Filtering by Role

The Notice model has a `type` field with enum `["student", "faculty", "both"]`:

```js
// Notice schema
type: { type: String, required: true, enum: ["student", "faculty", "both"] }
```

### How Filtering Should Work

- Students see notices where `type === "student"` OR `type === "both"`
- Faculty see notices where `type === "faculty"` OR `type === "both"`
- Admins see all notices

### Current Implementation

```js
const getNoticeController = async (req, res) => {
  const notices = await Notice.find();  // Returns ALL notices
};
```

**No filtering** — all roles see all notices. The frontend could filter client-side, but this leaks data.

**Better approach**: Accept a `role` query parameter and filter server-side:
```js
const notices = await Notice.find({ type: { $in: [role, "both"] } });
```

---

## Material Ownership Enforcement

This is the **one place** where the backend actually enforces resource ownership:

```js
// Update: only the uploading faculty can edit
if (material.faculty.toString() !== req.userId) {
  return ApiResponse.unauthorized(
    "You are not authorized to update this material"
  ).send(res);
}

// Delete: same check
if (material.faculty.toString() !== req.userId) {
  return ApiResponse.unauthorized(
    "You are not authorized to delete this material"
  ).send(res);
}
```

### Why This Matters

- Faculty A uploads notes → only Faculty A can edit/delete them
- This prevents accidental or malicious modification of other faculty's materials
- The `faculty` field stores the uploader's `_id` (set from `req.userId` in auth middleware)

### Gap

There's no check on who can **view** materials. Any authenticated user can query all materials. In a proper system, students should only see materials for their branch and semester.

---

## Frontend Route Protection

```jsx
// Login.jsx - Redirect if already logged in
useEffect(() => {
  const userToken = localStorage.getItem("userToken");
  if (userToken) {
    navigate(`/${localStorage.getItem("userType").toLowerCase()}`);
  }
}, [navigate]);

// App.jsx - ProtectedRoute component
<ProtectedRoute>
  <AdminLayout><Dashboard /></AdminLayout>
</ProtectedRoute>
```

### How the frontend "enforces" roles:

1. On login, `userType` ("Admin", "Faculty", "Student") is saved to localStorage
2. After login, the user is redirected to `/${userType}` (e.g., `/admin`)
3. Each role has different Layout components with different sidebar links
4. `ProtectedRoute` checks for a valid token — but not the role

### Weakness

A faculty member can manually navigate to `/admin` in the browser. The `ProtectedRoute` only checks for a token, not the user type. The UI would render but API calls would query the wrong model.

---

## What Could Break If Changed

1. **Remove auth middleware from routes** → All endpoints become public, anyone can CRUD any data
2. **Remove material ownership check** → Faculty can delete each other's materials
3. **Add role to JWT but not verify it** → False security; role in token doesn't mean role is checked
4. **Share one login endpoint for all roles** → Would need to search 3 collections, returning the wrong user type
5. **Remove `userType` from localStorage** → Frontend can't route to the correct dashboard

---

## Most Likely Interview Questions

**Q: How do you implement role-based access control?**
> Access control is primarily implemented through route separation — each role has its own set of routes and controllers that query role-specific database models. The auth middleware verifies the JWT but doesn't check roles. Material ownership is enforced at the controller level by comparing the `faculty` field with `req.userId`. In a production system, I'd add a `requireRole()` middleware that verifies the user belongs to the expected role before granting access.

**Q: Can a student access admin endpoints?**
> Technically yes — the auth middleware only validates the JWT, not the role. The frontend prevents this through UI restrictions, but a determined user with Postman could make cross-role requests. The fix is a role-checking middleware that verifies `req.userId` exists in the correct collection.

**Q: How do you handle notice visibility per role?**
> Notices have a `type` field (student, faculty, or both). Ideally, the backend filters by role, but currently `getNoticeController` returns all notices without filtering. I'd add a query filter: `Notice.find({ type: { $in: [userRole, "both"] } })`.

**Q: Why separate routes per role instead of a single `/api/users` endpoint?**
> Because each role has a different schema, different validation rules, and different business logic. Combining them would require complex conditional logic in controllers. Separate routes keep each controller focused and simple.

---

## Cross/Follow-up Questions

- *How would you implement admin-only endpoints?* → Add `requireRole("admin")` middleware between `auth` and the controller.
- *What about fine-grained permissions?* → Implement a permission matrix: `{ admin: ["manage_users", "manage_notices"], faculty: ["upload_marks", "upload_materials"] }`. Check in middleware.
- *How would you prevent horizontal privilege escalation?* → Ensure users can only access their own data: `if (req.params.id !== req.userId) return 403`.
- *What's the difference between authentication and authorization?* → Authentication verifies WHO you are (JWT). Authorization verifies WHAT you're allowed to do (role checks).

---

## Why This Implementation Matters

RBAC is a **critical security topic** in backend interviews:
- Shows you understand the difference between authentication and authorization
- Demonstrates awareness of security boundaries
- Reveals if you know the difference between client-side and server-side enforcement
- Tests your ability to identify and articulate security gaps

---

## Common Mistakes / Edge Cases

1. **Trusting frontend role checks** → Client-side checks are for UX only; never security
2. **JWT role claim without verification** → Adding `role: "admin"` to JWT but never checking it
3. **Mixing up ObjectId strings** → `material.faculty` is an ObjectId; `req.userId` is a string. `.toString()` is required for comparison
4. **Missing ownership check on GET** → Even read access should respect ownership boundaries
5. **Admin registering without auth** → The registration endpoint lacks auth middleware — anyone can create admins. This is the most critical security flaw.
