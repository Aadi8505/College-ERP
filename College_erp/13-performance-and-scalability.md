# 13 — Performance & Scalability

## What This Covers

Current performance characteristics, database query optimization opportunities, the N+1 problem, scaling strategies, and what would need to change for high traffic.

---

## Current Performance Profile

### Where Time Is Spent

| Operation | Avg Time | Type | Frequency |
|-----------|----------|------|-----------|
| MongoDB query (findOne) | 5–50ms | I/O | Every request |
| MongoDB query (find) | 10–100ms | I/O | List views |
| `populate()` per ref | 5–30ms | I/O | Every populated query |
| `bcrypt.compare()` | ~100ms | CPU | Every login |
| `bcrypt.hash()` | ~100ms | CPU | Every registration/password change |
| `jwt.sign()` | ~1ms | CPU | Every login |
| `jwt.verify()` | ~1ms | CPU | Every authenticated request |
| File upload (multer) | 10–500ms | I/O | File operations |
| Email (nodemailer) | 500–3000ms | Network | Password reset |

### Bottlenecks

1. **bcrypt on login**: 100ms CPU-blocking per login
2. **`populate()` chains**: 3 populates = 3 extra queries = 15–90ms added
3. **Bulk marks loop**: 2N sequential DB queries
4. **No pagination**: `find()` returns ALL documents; grows linearly with data

---

## The N+1 Problem

### What It Is

Loading a list of N items, then making N additional queries to load related data.

### Where It Happens

```js
// Get all students with branch info
const students = await studentDetails
  .find()
  .select("-__v -password")
  .populate("branchId");  // 1 query for students + N queries for branches
```

With 100 students across 5 branches, Mongoose makes:
- 1 query: `db.studentdetails.find({})`
- 100 queries: `db.branches.findOne({ _id: "..." })` (one per student)

**Total: 101 queries** (even though only 5 unique branches exist)

### Fix: MongoDB `$lookup` Aggregation

```js
const students = await studentDetails.aggregate([
  { $lookup: {
      from: "branches",
      localField: "branchId",
      foreignField: "_id",
      as: "branch"
  }},
  { $unwind: "$branch" },
  { $project: { password: 0, __v: 0 } }
]);
```

**Result**: 1 query with a server-side join. Much faster.

### Alternative: Denormalization

Store branch name directly in the student document:
```js
{
  enrollmentNo: 123456,
  branchId: ObjectId("..."),
  branchName: "Computer Science"  // Denormalized copy
}
```

**Tradeoff**: Faster reads but branch name updates require updating all student documents.

---

## Missing: Pagination

### Current Problem

```js
const users = await studentDetails.find().select("-__v -password").populate("branchId");
```

Returns ALL students. With 10,000 students, this:
- Consumes server memory (all documents loaded at once)
- Slow network transfer (large JSON payload)
- Frontend lag (rendering 10,000 rows)

### Solution: Skip + Limit Pagination

```js
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const [students, total] = await Promise.all([
  studentDetails.find().skip(skip).limit(limit).populate("branchId"),
  studentDetails.countDocuments()
]);

return ApiResponse.success({
  students,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});
```

### Better: Cursor-Based Pagination

Skip-based pagination degrades with large offsets (`skip(10000)` still scans 10,000 documents).

```js
// Use the last document's ID as a cursor
const students = await studentDetails
  .find({ _id: { $gt: lastId } })
  .limit(20)
  .sort({ _id: 1 });
```

---

## Missing: Database Indexes

### Currently Indexed

| Collection | Field | Index Type |
|-----------|-------|------------|
| Branch | `branchId` | Unique |
| Branch | `name` | Unique |

### Should Be Indexed

| Collection | Field(s) | Why |
|-----------|---------|-----|
| AdminDetail | `email` | Login queries |
| FacultyDetail | `email` | Login queries |
| StudentDetail | `email` | Login queries |
| StudentDetail | `enrollmentNo` | Registration check + search |
| StudentDetail | `branchId + semester` | Marks lookup |
| Marks | `studentId + examId + subjectId + semester` | Bulk marks upsert |
| Material | `branch + semester + type` | Filtered queries |
| ResetPassword | `userId + type` | Reset token lookup |

### Impact of Missing Indexes

Without indexes, MongoDB performs **collection scans** — reading every document to find matches. With 10,000 students, login takes 10,000 document comparisons instead of 1 B-tree lookup.

---

## Scaling Strategies

### Vertical Scaling (Scale Up)

- Upgrade Render plan for more CPU/RAM
- Useful up to ~1000 concurrent users
- Simple but has ceiling

### Horizontal Scaling (Scale Out)

- Run multiple backend instances behind a load balancer
- **Works because**: JWT is stateless — any server can verify any token
- **Issue**: File uploads are local — need cloud storage (S3) first
- **Issue**: No shared state — each instance has its own file system

### Caching Layer

```
Client → CDN (static files) → Load Balancer → Backend → Redis (cache) → MongoDB
```

**What to cache**:
- Branch list (rarely changes): 5-minute cache
- Subject list per branch: 5-minute cache
- Timetables: Until updated
- Notice list: 1-minute cache

**What NOT to cache**:
- Marks (frequently updated during exam season)
- Auth tokens (must validate against latest secret)
- User profiles (privacy-sensitive)

---

## Frontend Performance

### Current State

- **CRA build**: Minified, tree-shaken, code-split by route (React.lazy)
- **Tailwind CSS**: Purged in production (only used classes included)
- **No lazy loading**: All components loaded upfront

### Improvements

1. **React.lazy + Suspense**: Load role-specific screens on demand
```jsx
const AdminDashboard = React.lazy(() => import('./Screens/Admin/Home'));
```

2. **Image optimization**: Profile images served at original resolution. Should resize server-side.

3. **API response caching**: React Query or SWR for automatic request deduplication and caching.

---

## What Could Break If Changed

1. **Add too many indexes** → Write performance degrades (each insert updates all indexes)
2. **Cache user data without invalidation** → Stale data shown after profile updates
3. **Remove `select("-password")` for performance** → Security regression for minor speed gain
4. **Parallelize `pre('save')` hooks** → Mongoose hooks are designed to run sequentially
5. **Add pagination without sorting** → Results differ between pages due to MongoDB's non-deterministic order

---

## Most Likely Interview Questions

**Q: What are the performance bottlenecks in your project?**
> The main bottlenecks are: (1) bcrypt blocking the event loop on login, (2) the bulk marks upload making 2N sequential database calls, (3) `populate()` generating N+1 queries for list views, and (4) no pagination — all queries return full result sets.

**Q: How would you scale this to 10,000 users?**
> Add database indexes on frequently queried fields (email, enrollmentNo). Implement pagination for all list endpoints. Replace the bulk marks loop with `bulkWrite()`. Add a Redis cache for slowly-changing data (branches, subjects). Move file uploads to S3. Deploy multiple backend instances behind a load balancer.

**Q: What is the N+1 problem and where does it occur?**
> The N+1 problem is when loading N items triggers N additional queries for related data. In our project, `studentDetails.find().populate("branchId")` loads all students (1 query) then makes N queries to load each student's branch. The fix is to use MongoDB's `$lookup` aggregation for a single-query server-side join.

**Q: Why didn't you add indexes?**
> For a college with a few hundred users, collection scans are fast enough. Adding indexes would be the first optimization step for a larger deployment. The tradeoff is that indexes speed up reads but slow down writes and consume additional storage.

---

## Cross/Follow-up Questions

- *What's the difference between `$lookup` and `populate()`?* → `$lookup` runs on the MongoDB server (one query). `populate()` runs in the Mongoose driver (multiple queries from Node.js to MongoDB).
- *How does MongoDB indexing work?* → B-tree indexes. MongoDB stores the indexed field values in a sorted tree structure. Lookups are O(log N) instead of O(N).
- *What is connection pooling?* → Mongoose maintains a pool of connections to MongoDB (default: 5). Requests reuse connections instead of opening new ones. This avoids TCP handshake overhead.
- *How would you profile slow queries?* → Enable MongoDB's slow query log (`db.setProfilingLevel(1, { slowms: 100 })`). Use `explain()` on queries to see execution plans.

---

## Why This Implementation Matters

Performance questions show if you can:
- Identify bottlenecks without being told
- Reason about complexity (O(N) vs O(log N) vs O(1))
- Balance optimization effort vs. actual need
- Scale incrementally without over-engineering

---

## Common Mistakes / Edge Cases

1. **Premature optimization**: Adding Redis caching before the app has 100 users — complexity without benefit
2. **Over-indexing**: Every field indexed → inserts become slow, disk usage explodes
3. **Forgetting `lean()`**: `Model.find().lean()` returns plain objects instead of Mongoose documents — 3-5x faster for read-only queries
4. **Counting with `find().length`**: Downloads ALL documents just to count. Use `countDocuments()` instead.
5. **Sorting without indexes**: `sort({ enrollmentNo: 1 })` without an index on `enrollmentNo` requires loading all documents into memory for sorting.
