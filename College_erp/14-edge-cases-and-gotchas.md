# 14 — Edge Cases & Gotchas

## What This Covers

Known boundary conditions, failure modes, inconsistencies, and subtle bugs that could surface in production — the kind of details interviewers love to probe.

---

## Authentication Edge Cases

### 1. Token Valid But User Deleted

**Scenario**: Admin deletes a faculty member. The faculty's JWT is still valid for up to 1 hour.

**What happens**: The faculty can still call `/api/faculty/my-details`. The controller calls `findById(req.userId)`, which returns `null`. The 404 response is returned, but the faculty could still access other endpoints that don't verify user existence.

**Fix**: Check user existence in auth middleware (adds a DB query per request) OR implement token blacklisting.

### 2. Simultaneous Login from Multiple Devices

**Scenario**: User logs in from laptop AND phone.

**What happens**: Both get valid JWTs. There's no session management, so both work independently. Logging out on one device (clearing localStorage) doesn't affect the other.

**Impact**: Not necessarily a bug — but the user can't "log out everywhere."

### 3. Clock Skew and JWT Expiry

**Scenario**: Client's clock is ahead of server's clock by 5 minutes.

**What happens**: A token that "just" expired on the server might appear valid on the client. The client sends it, server rejects it, AxiosWrapper redirects to login.

### 4. `userType` Mismatch

**Scenario**: LocalStorage has `userToken` but `userType` is missing or corrupted.

```js
navigate(`/${localStorage.getItem("userType").toLowerCase()}`);
```

**What happens**: `.toLowerCase()` is called on `null` → **Runtime crash**. The login page becomes inaccessible.

**Fix**: Add null check: `localStorage.getItem("userType")?.toLowerCase() || ""`.

---

## Database Edge Cases

### 5. Invalid ObjectId Format

**Scenario**: API call with malformed ID: `GET /api/student/not-an-id`.

**What happens**: Mongoose's `findById("not-an-id")` throws a `CastError`:
```
CastError: Cast to ObjectId failed for value "not-an-id"
```

**Current handling**: Caught by try-catch → 500 Internal Server Error. But it should be 400 Bad Request.

**Fix**: Validate ObjectId format before querying:
```js
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return ApiResponse.badRequest("Invalid ID format").send(res);
}
```

### 6. Duplicate Key vs Application-Level Check

**Scenario**: Two simultaneous registration requests with the same email.

**Race condition flow**:
1. Request A: `findOne({ email })` → no match
2. Request B: `findOne({ email })` → no match (A hasn't created yet)
3. Request A: `create()` → success
4. Request B: `create()` → depends on schema

**If no unique index**: Both succeed → duplicate users. Corrupted data.
**If unique index**: MongoDB throws `E11000` → caught by `error.code === 11000` → 409 Conflict.

**Current state**: No unique index on `email` in any user model. The `findOne` check before create is the only protection — vulnerable to race conditions.

### 7. `pre('save')` Not Firing on Updates

**Scenario**: Admin updates a user's password via `findByIdAndUpdate()`.

**What happens if forgotten**: Password stored in plaintext. Login with the old hash still works, but the new plaintext password is compared against a hash → **login always fails with the new password**.

**Current state**: The controllers correctly handle this by manually hashing. But it's a landmine for future developers.

---

## Business Logic Edge Cases

### 8. Marks with Value 0 vs No Marks

```js
obtainedMarks: studentMarks ? studentMarks.marksObtained : 0
```

**Problem**: A student who scored 0 marks is indistinguishable from a student who hasn't been graded yet. Both show as `0`.

**Fix**: Use `null` for "not graded" and `0` for "zero marks":
```js
obtainedMarks: studentMarks ? studentMarks.marksObtained : null
```

### 9. Student Email Auto-Generation

```js
const email = `${enrollmentStr}@gmail.com`;
```

**What it does**: Generates email from enrollment number (e.g., `123456@gmail.com`).

**Edge cases**:
- This may not be the student's real email → password reset links go to a non-existent inbox
- If enrollment number changes, the email doesn't update
- Gmail treats `123456@gmail.com` as a real email address — could belong to someone

### 10. Branch Deletion with Dependent Data

**Scenario**: Admin deletes a branch that has students, faculty, subjects, and timetables referencing it.

**What happens**: Students, subjects, etc. retain the deleted branch's ObjectId. `populate("branchId")` returns `null`. Frontend shows "undefined" where branch name should be.

**Fix**: Either prevent deletion (check for dependencies first) or cascade delete all related data:
```js
// Before deleting branch
const studentsCount = await Student.countDocuments({ branchId: id });
if (studentsCount > 0) {
  return ApiResponse.conflict("Cannot delete branch with active students").send(res);
}
```

### 11. Timetable Overwrite Without Warning

```js
let timetable = await Timetable.findOne({ semester, branch });
if (timetable) {
  timetable = await Timetable.findByIdAndUpdate(timetable._id, { link: req.file.filename });
}
```

**What happens**: Uploading a new timetable silently replaces the old one. No confirmation, no version history. The old file remains on disk (orphaned).

### 12. Empty Search Results → 404

```js
if (!users || users.length === 0) {
  return ApiResponse.notFound("No Student Found").send(res);
}
```

**Problem**: An empty result set returns 404 (Not Found). But 404 means "the resource doesn't exist." An empty search result is a valid response — it should be 200 with an empty array.

**Better**: `return ApiResponse.success([], "No students found").send(res);`

The marks controller does this correctly:
```js
return res.status(200).json({ success: true, data: [], message: "No marks found" });
```

---

## Frontend Edge Cases

### 13. Stale Redux State After Token Expiry

**Scenario**: Token expires while the user is viewing a page.

**What happens**: 
1. User is on the student dashboard with cached data
2. They click a button that triggers an API call
3. Backend returns 401
4. AxiosWrapper clears localStorage and redirects
5. Redux state still has old `userData` — irrelevant since the page reloads

### 14. Browser Back Button After Logout

**Scenario**: User logs out, then presses the browser's back button.

**What happens**: The browser shows the cached version of the previous page. If the user clicks anything, API calls fail with 401 (token cleared), and they're redirected to login.

**Fix**: Add `window.history.pushState` or use `navigate('/', { replace: true })` on logout.

### 15. FormData Nested Objects

**Scenario**: Student registration sends `emergencyContact` as nested object.

```js
// Frontend sends FormData:
formData.append("emergencyContact[name]", "John");
formData.append("emergencyContact[relationship]", "Father");
```

**Controller handles both formats**:
```js
const emergencyContact = {
  name: req.body["emergencyContact[name]"] || req.body.emergencyContact?.name || "",
  // ...
};
```

**Why both**: `multipart/form-data` (when file is attached) flattens nested objects to bracket notation. JSON body preserves nested structure. The controller handles both cases.

---

## API Inconsistencies

### 16. Mixed Response Patterns

| Controller | Pattern | Example |
|-----------|---------|---------|
| Admin, Faculty, Student | `ApiResponse` | `ApiResponse.success(data).send(res)` |
| Branch, Subject, Notice | `ApiResponse.error()` | `ApiResponse.error("Not Found", 404).send(res)` |
| Marks | Raw `res.json()` | `res.status(400).json({ success: false })` |

Frontend must handle all three patterns, though the output structure is similar.

### 17. HTTP Status Code Misuse

- Empty results return **404** (should be 200 with empty array)
- Token expired returns **404** in some places (should be 401)
- Using `ApiResponse.unauthorized()` for ownership failures (should be 403 Forbidden)

---

## What Could Break If Changed

1. **Add `unique: true` to existing fields with duplicates** → MongoDB startup error, all operations blocked
2. **Remove the `emergencyContact` dual-format handling** → Student registration breaks when profile image is attached (FormData mode)
3. **Return 200 for empty results** → Frontend code checking `response.status === 404` for "no data" stops working
4. **Add `required: true` to optional schema fields** → Existing documents without those fields can't be updated (validation fails)
5. **Switch from CRA to Vite** → `process.env.REACT_APP_*` variables need to change to `import.meta.env.VITE_*`

---

## Most Likely Interview Questions

**Q: What edge cases did you encounter and how did you handle them?**
> Several: (1) The `pre('save')` hook not firing on `findByIdAndUpdate` — we manually hash passwords in update controllers. (2) FormData flattening nested objects — the controller handles both bracket notation and nested JSON. (3) Race conditions on registration — the findOne check before create isn't atomic; we'd add a unique index for production. (4) Deleted references — deleting a branch leaves orphaned ObjectIds in students, causing null populates.

**Q: What would you change if you were to rebuild this project?**
> (1) Use a single User model with a `role` field and shared auth logic to eliminate code duplication. (2) Add proper role-based middleware instead of relying on frontend routing. (3) Implement pagination on all list endpoints. (4) Use cloud storage for file uploads. (5) Add comprehensive input validation with a library like Zod. (6) Use TypeScript for type safety. (7) Add a global error handler and request validation middleware.

**Q: What happens if two users register with the same email simultaneously?**
> The `findOne` check before `create` isn't atomic. Both requests could pass the check and create duplicate users. The fix is adding `unique: true` to the email field in the schema, which makes MongoDB enforce uniqueness at the database level. The catch block handles the E11000 error gracefully.

**Q: How do you handle the difference between "no data" and "not found"?**
> Currently, some controllers return 404 for empty results, which is incorrect — 404 means the resource doesn't exist. An empty search result should be 200 with an empty array. The marks controller does this correctly. I'd standardize all controllers to return 200 with empty arrays for valid queries that return no results.

---

## Cross/Follow-up Questions

- *How would you add soft deletes?* → Add a `deletedAt` timestamp field. Change `find()` to `find({ deletedAt: null })`. Change `delete()` to `update({ deletedAt: new Date() })`.
- *How would you handle data migrations?* → Write scripts similar to the seeder that modify documents in bulk. Test on a staging database first.
- *What about data consistency across related models?* → MongoDB doesn't have foreign key constraints. Use application-level checks or Mongoose middleware to maintain consistency.
- *How do you prevent an admin from deleting themselves?* → Check `if (req.params.id === req.userId) return 400`.

---

## Why This Implementation Matters

Edge case awareness separates **junior from mid-level developers**. Interviewers test:
- Can you identify subtle bugs without being told?
- Do you understand failure modes?
- Can you reason about concurrent operations?
- Do you know the difference between "works in demo" and "works in production"?

---

## Common Mistakes / Edge Cases Summary Table

| # | Edge Case | Impact | Status |
|---|-----------|--------|--------|
| 1 | Deleted user + valid token | Ghost access for 1 hour | ⚠️ Not handled |
| 2 | Null `userType` in localStorage | Frontend crash | ⚠️ Not handled |
| 3 | Invalid ObjectId in URL | 500 instead of 400 | ⚠️ Partially handled |
| 4 | Race condition on registration | Possible duplicates | ⚠️ Not handled |
| 5 | 0 marks vs no marks | Indistinguishable | ⚠️ Not handled |
| 6 | Branch delete with dependencies | Orphaned references | ⚠️ Not handled |
| 7 | Empty results → 404 | Incorrect status code | ⚠️ Inconsistent |
| 8 | FormData nested objects | Dual-format parsing | ✅ Handled |
| 9 | `pre('save')` on update | Manual hashing | ✅ Handled |
| 10 | Duplicate key on create | E11000 catch block | ✅ Handled |
