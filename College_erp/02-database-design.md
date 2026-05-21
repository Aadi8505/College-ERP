# 02 — Database Design & Schema Architecture

## What This Covers

MongoDB schema design using Mongoose, relationships between collections, indexing strategies, the decision to use three separate user models, and how `populate()` works across the system.

---

## Entity Relationship Overview

```
                    ┌─────────────────┐
                    │     Branch      │
                    │  branchId (str) │
                    │  name           │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐  ┌──▼──────────┐  ┌▼──────────────┐
     │ FacultyDetail  │  │StudentDetail│  │   Subject      │
     │ employeeId     │  │enrollmentNo │  │ name, code     │
     │ branchId (ref) │  │branchId(ref)│  │ branch (ref)   │
     │ password (hash)│  │semester     │  │ semester       │
     └────────┬───────┘  │password     │  │ credits        │
              │          └──────┬──────┘  └───┬────────────┘
              │                 │              │
              ▼                 │              │
     ┌────────────────┐        │         ┌────▼────────┐
     │   Material     │        │         │   Marks      │
     │ faculty (ref)  │        │         │ studentId    │
     │ subject (ref)  │        │         │ subjectId    │
     │ branch (ref)   │        │         │ examId       │
     │ file           │        │         │ marksObtained│
     └────────────────┘        │         │ semester     │
                               │         └─────────────┘
     ┌────────────────┐        │
     │   Timetable    │   ┌────▼────────┐    ┌───────────────┐
     │ branch (ref)   │   │    Exam     │    │ AdminDetail   │
     │ semester       │   │ name, date  │    │ employeeId    │
     │ link (file)    │   │ examType    │    │ isSuperAdmin  │
     └────────────────┘   │ totalMarks  │    │ password      │
                          └─────────────┘    └───────────────┘
     ┌────────────────┐
     │    Notice      │    ┌──────────────────┐
     │ title, desc    │    │  ResetPassword   │
     │ type (enum)    │    │ userId (refPath) │
     │ link           │    │ type (enum)      │
     └────────────────┘    │ resetToken       │
                           └──────────────────┘
```

---

## The "Three User Models" Decision

### What: Three separate Mongoose models for Admin, Faculty, and Student

Instead of one `User` model with a `role` field, this project has:
- `AdminDetail` — with `isSuperAdmin`, `designation`, `salary`, `joiningDate`
- `FacultyDetail` — with `branchId`, `designation`, `salary`, `joiningDate`
- `StudentDetail` — with `enrollmentNo`, `semester`, `branchId`

### Why This Approach?

1. **Different fields**: Admin has `isSuperAdmin`; Student has `enrollmentNo` and `semester`; Faculty has `branchId` but no enrollment number. A single model would have many nullable fields.
2. **Different validation rules**: Student registration auto-generates email from enrollment number. Admin/Faculty use provided emails.
3. **Independent queries**: Fetching all students never accidentally returns faculty. No need for `{role: "student"}` filter on every query.

### Tradeoff: Single User Model Alternative

| Aspect | Three Models (Chosen) | Single User Model |
|--------|----------------------|-------------------|
| Schema clarity | ✅ Each model is focused | ❌ Many nullable/conditional fields |
| Code duplication | ❌ Login/register/reset code repeated 3x | ✅ Shared auth logic |
| Cross-role queries | ❌ Must query 3 collections | ✅ Single query with role filter |
| Scalability | ⚠️ Adding a role means a new model | ✅ Just add a role value |
| Polymorphic references | ❌ `ResetPassword` needs `refPath` | ✅ Simple `userId` ref |

**Interview answer**: "We chose three separate models because admin, faculty, and student have fundamentally different schemas. The cost is duplicated auth logic across controllers, which we'd refactor into shared middleware if the project grew."

---

## Key Schema Patterns

### 1. Password Hashing with `pre('save')` Hook

```js
adminDetailsSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});
```

**What it does**: Automatically hashes the password before saving to the database.

**Why `isModified()` check**: Without it, the password would be double-hashed on every `.save()` call, even if only the name was changed.

**Critical gotcha**: This hook does NOT fire on `findByIdAndUpdate()`. That's why the update and password-change controllers manually hash with `bcrypt.genSalt(10)` + `bcrypt.hash()`.

### 2. Enum Validation

```js
gender: { type: String, enum: ["male", "female", "other"] }
status: { type: String, enum: ["active", "inactive"], default: "active" }
examType: { type: String, enum: ["mid", "end"] }
```

**Why**: Mongoose-level validation prevents invalid data before it reaches MongoDB. Cheaper than application-level validation alone.

### 3. ObjectId References with `populate()`

```js
branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }
```

When queried with `.populate("branchId")`, Mongoose replaces the ObjectId with the full Branch document. This is MongoDB's equivalent of a SQL JOIN.

**Performance implication**: Each `populate()` generates a separate query. Three populates = three additional DB queries.

### 4. Polymorphic Reference (`refPath`)

```js
// ResetPassword model
userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "type" },
type: { type: String, required: true, enum: ["AdminDetails", "FacultyDetails", "StudentDetails"] }
```

**What it does**: `refPath` tells Mongoose which collection to look up based on the `type` field value. One `ResetPassword` model serves all three user types.

**Why it's clever**: Without `refPath`, you'd need three separate reset password models or hardcode the collection lookup.

---

## Timestamps

All models use `{ timestamps: true }` which auto-adds `createdAt` and `updatedAt` fields. Exception: `Notice` and `Marks` define `createdAt` manually (a minor inconsistency).

---

## Indexing & Uniqueness

| Model | Unique Fields | Index Type |
|-------|--------------|------------|
| Branch | `branchId`, `name` | Unique (schema-level) |
| Subject | `code` | Checked in controller, not schema |
| AdminDetail | `employeeId` | Generated randomly, checked in controller |
| StudentDetail | `enrollmentNo` | Checked in controller |
| FacultyDetail | None enforced | Checked via `$or` query |

### Missing Indexes (Know This as a Weakness)

- No compound index on `Marks(studentId, examId, subjectId, semester)` — the bulk marks controller queries by this combination frequently.
- No index on `email` fields — login queries scan the entire collection.
- Student's `enrollmentNo` should have `unique: true` at the schema level.

---

## What Could Break If Changed

1. **Remove `pre('save')` hook** — Passwords stored in plaintext, massive security breach
2. **Change model names** — `ref: "Branch"` must match `mongoose.model("Branch", ...)` exactly; mismatch causes populate failures
3. **Remove `refPath` from ResetPassword** — `populate("userId")` won't know which collection to query
4. **Add `unique: true` to fields that have duplicates** — Mongoose throws `E11000 duplicate key error` on existing data
5. **Change `enrollmentNo` from Number to String** — Existing data won't match, queries return wrong results

---

## Most Likely Interview Questions

**Q: Why did you use three separate user models instead of one?**
> Because admin, faculty, and student have fundamentally different schemas. Student has `enrollmentNo` and `semester`, admin has `isSuperAdmin`, faculty has `branchId`. A single model would have many nullable fields and conditional validation. The tradeoff is duplicated auth logic, which is manageable at this scale.

**Q: How does `populate()` work internally?**
> Mongoose stores ObjectIds in the document. When you call `.populate("branchId")`, it makes a separate query to the `Branch` collection using that ObjectId and replaces the field with the full document. It's essentially a client-side JOIN.

**Q: Why not use SQL for this project?**
> The user profiles have different structures per role, making MongoDB's flexible schemas a natural fit. The data access patterns are mostly document-level (fetch one user, update one student), not heavy relational queries. That said, SQL with a `users` table and `role` column would also work.

**Q: What is `refPath` and why did you use it?**
> `refPath` is a Mongoose feature for polymorphic references. The `ResetPassword` model needs to reference either an Admin, Faculty, or Student. Instead of three separate foreign keys, `refPath` reads the `type` field to know which collection to look up. It keeps the schema DRY.

---

## Cross/Follow-up Questions

- *How would you handle data migrations?* → MongoDB doesn't need schema migrations like SQL. For field additions, use Mongoose defaults. For field renames, write a one-time script.
- *What's the N+1 problem with populate?* → Fetching 100 students and populating `branchId` makes 100 extra queries. Solution: use `$lookup` aggregation or denormalize.
- *Why is `enrollmentNo` a Number, not String?* → It's numeric by nature. But storing as String would preserve leading zeros. This is a design consideration worth mentioning.

---

## Why This Implementation Matters

Database design questions reveal if you understand:
- Data normalization vs. denormalization tradeoffs
- When references (joins) are worth the query cost
- How Mongoose hooks work (and their gotchas)
- Why schema validation matters even in a "schemaless" database

---

## Common Mistakes / Edge Cases

1. **`pre('save')` not firing on updates** — Most common bug. Must manually hash password in update controllers.
2. **Forgetting to `populate()`** — Frontend receives ObjectId strings instead of branch/subject names.
3. **Enum mismatch** — Sending `"Male"` when schema expects `"male"` causes validation error.
4. **`E11000` on seeder rerun** — `admin-seeder.js` deletes all admins first to handle this, but other seeders may not.
5. **ObjectId format** — Passing a non-ObjectId string to `.findById()` throws a `CastError`, not a 404.
