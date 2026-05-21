# 11 — Async Patterns & Promise Handling

## What This Covers

How async/await is used throughout the codebase, promise chain patterns, potential race conditions, and the event loop implications of the architecture.

---

## async/await Pattern (Used Everywhere)

Every controller and middleware is an async function:

```js
const loginAdminController = async (req, res) => {
  try {
    const user = await adminDetails.findOne({ email });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    return ApiResponse.success({ token }).send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};
```

### Why async/await over Promises?

- **Readability**: Linear code flow instead of `.then()` chains
- **Error handling**: `try-catch` works naturally (no `.catch()` needed)
- **Debugging**: Stack traces are cleaner with async/await

### The try-catch Requirement

Without try-catch, a rejected promise (e.g., DB connection error) would result in an **unhandled promise rejection**, which:
- In Node.js 15+: **terminates the process**
- In older versions: Logs a warning but keeps running (dangerous)

---

## Database Operations: All Async

Every Mongoose operation returns a promise:

```js
// These are ALL async operations (I/O bound)
await adminDetails.findOne({ email });           // ~5-50ms
await bcrypt.compare(password, user.password);    // ~100ms (CPU bound!)
await adminDetails.create({ ...req.body });       // ~10-50ms
await adminDetails.findByIdAndUpdate(id, data);   // ~10-50ms
await adminDetails.findByIdAndDelete(id);         // ~10-50ms
```

### bcrypt.compare is CPU-Bound

Unlike database queries (I/O-bound), bcrypt is **CPU-bound**. It blocks the event loop during hashing/comparison (~100ms per call). For a single user login, this is fine. For 1000 concurrent logins, the server would become unresponsive.

**Why this matters**: Express runs on a single thread. Blocking it means ALL other requests wait.

**Fix for production**: Use worker threads or a separate auth service that offloads bcrypt operations.

---

## Sequential vs Parallel Async Calls

### Sequential (Current Pattern)

```js
// Student controller - two sequential queries
const user = await adminDetails.findOne({ email });
const isPasswordValid = await bcrypt.compare(password, user.password);
```

**Why sequential here**: `bcrypt.compare` needs the user's password hash, so it MUST come after `findOne`. These have a data dependency.

### Where Parallel Would Help

```js
// Material controller - three independent populates
const populatedMaterial = await Material.findById(material._id)
  .populate("subject")
  .populate("faculty")
  .populate("branch");
```

Mongoose chains these, but each `.populate()` generates a separate DB query. With manual `Promise.all()`:

```js
const [subject, faculty, branch] = await Promise.all([
  Subject.findById(material.subject),
  Faculty.findById(material.faculty),
  Branch.findById(material.branch),
]);
```

This runs all three queries simultaneously instead of sequentially.

---

## The Bulk Marks Problem: N Sequential Awaits

```js
for (const markData of marks) {
  const existingMark = await Marks.findOne({...});  // Wait for each one
  if (existingMark) {
    existingMark.marksObtained = markData.obtainedMarks;
    await existingMark.save();
  } else {
    await Marks.create({...});
  }
}
```

### Why This Is Problematic

For N students: N × `findOne` + N × (`save` or `create`) = **2N sequential DB calls**.

Each `await` suspends the function, returns to the event loop, and resumes after the DB responds. With 60 students and 20ms per query: **60 × 2 × 20ms = 2.4 seconds** minimum.

### Better: `Promise.all()` with Map

```js
await Promise.all(marks.map(async (markData) => {
  const existing = await Marks.findOne({...});
  if (existing) {
    existing.marksObtained = markData.obtainedMarks;
    await existing.save();
  } else {
    await Marks.create({...});
  }
}));
```

This runs all student marks operations **in parallel**, reducing total time from N × latency to 1 × latency.

### Best: MongoDB `bulkWrite`

One single DB operation instead of 2N:
```js
await Marks.bulkWrite(marks.map(m => ({
  updateOne: {
    filter: { studentId: m.studentId, examId, subjectId, semester },
    update: { $set: { marksObtained: m.obtainedMarks } },
    upsert: true
  }
})));
```

---

## Race Conditions

### Password Reset Race Condition

```js
// Step 1: Delete old tokens
await resetToken.deleteMany({ type: "AdminDetails", userId: user._id });

// Step 2: Create new token
const resetId = await resetToken.create({ resetToken: resetTkn, userId: user._id });
```

**Potential race**: If two reset requests come in simultaneously:
1. Request A deletes old tokens
2. Request B deletes old tokens (including Request A's)
3. Request A creates a new token
4. Request B creates a new token
5. Both tokens exist — user gets two valid reset links

**Impact**: Low. Both reset links work, and using either one deletes all tokens for that user.

**Fix**: Use `findOneAndReplace()` with upsert — atomic operation.

### Student Registration Race Condition

```js
const existingStudent = await studentDetails.findOne({ enrollmentNo });
if (existingStudent) return ApiResponse.conflict();
// ... time gap ...
const student = await studentDetails.create(studentData);
```

**Potential race**: Two simultaneous registration requests with the same enrollment number:
1. Request A checks — no existing student
2. Request B checks — no existing student (hasn't been created yet)
3. Request A creates — success
4. Request B creates — either duplicate entry (if no unique index) or `E11000` error (if unique index exists)

**Fix**: Add `unique: true` to `enrollmentNo` in the schema. The DB-level constraint catches races.

---

## MongoDB Connection: Fire-and-Forget

```js
const connectToMongo = () => {
  mongoose
    .connect(mongoURI, { useNewUrlParser: true })
    .then(() => console.log("Connected to MongoDB Successfully"))
    .catch((error) => console.error("Error connecting to MongoDB", error));
};
```

**Key observation**: The connection is async but NOT awaited in `index.js`:

```js
connectToMongo();  // No await — server starts before DB connects
const port = process.env.PORT || 4000;
app.listen(port);  // Server starts immediately
```

**What this means**: If MongoDB is slow to connect, early requests will fail with "buffering timed out" errors. Mongoose buffers operations while connecting, but there's a 10-second default timeout.

**Better pattern**:
```js
await connectToMongo();
app.listen(port);  // Only start after DB is ready
```

---

## Event Loop Considerations

### Non-Blocking I/O

All database queries, file operations, and network calls (nodemailer) are non-blocking. The event loop continues processing other requests while waiting for I/O.

### What Blocks the Event Loop

1. **`bcrypt.hash()`**: CPU-intensive, ~100ms per call
2. **`bcrypt.compare()`**: Same as hash, ~100ms
3. **`jwt.sign()`**: Minimal, but synchronous
4. **`jwt.verify()`**: Minimal, but synchronous
5. **Large `JSON.parse()`**: Express's `json()` middleware parsing large request bodies

### Why This Matters for Scaling

If 100 users try to login simultaneously, bcrypt hashing takes 100 × 100ms = 10 seconds of CPU time. Other requests (fetching timetables, loading marks) are blocked during this time.

---

## What Could Break If Changed

1. **Remove `await` from a DB call** → Returns a Promise object instead of the result; subsequent logic operates on the wrong data
2. **Use `for...in` instead of `for...of` for marks loop** → `for...in` iterates over indices, not values
3. **Remove try-catch** → Unhandled rejection crashes the server
4. **Parallelize dependent operations** → `bcrypt.compare()` before `findOne()` → comparing against undefined
5. **Change `connectToMongo` to sync** → MongoDB driver doesn't support sync connections

---

## Most Likely Interview Questions

**Q: How do you handle asynchronous operations in your backend?**
> All controllers are async functions that use `await` for database queries, bcrypt operations, and email sending. Each controller wraps its logic in try-catch to handle rejected promises. Mongoose operations return promises that resolve with query results. The event loop remains non-blocking for I/O operations, though bcrypt is CPU-bound.

**Q: What's the performance impact of the bulk marks loop?**
> It makes 2N sequential database calls for N students, each requiring a round-trip to the database. For 60 students at 20ms per query, that's ~2.4 seconds. Using `Promise.all()` would run them in parallel, or better yet, MongoDB's `bulkWrite()` would do it in a single operation.

**Q: Is `async/await` blocking?**
> No. `await` suspends the specific function but returns control to the event loop. Other requests continue processing. However, CPU-bound operations like bcrypt DO block the event loop because they run on the main thread.

**Q: What happens if the database isn't connected when a request arrives?**
> Mongoose buffers operations for up to 10 seconds while the connection is being established. If the connection fails, the buffered operations reject. The server starts before the connection is confirmed because `connectToMongo()` isn't awaited.

---

## Cross/Follow-up Questions

- *What's the difference between `async/await` and Promises?* → Same thing. `async/await` is syntactic sugar over Promises. An `async` function returns a Promise. `await` is equivalent to `.then()`.
- *What is the Node.js event loop?* → A mechanism that processes I/O events asynchronously. It checks for pending callbacks, timers, and I/O operations in phases, allowing non-blocking execution on a single thread.
- *How would you handle CPU-intensive tasks?* → Use Worker Threads, a task queue (Bull/BeeQueue), or offload to a separate microservice.
- *What is `Promise.allSettled()` vs `Promise.all()`?* → `all()` rejects if ANY promise rejects. `allSettled()` waits for ALL promises regardless of rejection. For bulk marks, `allSettled()` would be safer — one failed mark entry doesn't abort the rest.

---

## Why This Implementation Matters

Async handling is a **core Node.js concept**. Interviewers test:
- Understanding of the event loop and non-blocking I/O
- Ability to identify sequential vs parallel opportunities
- Awareness of CPU-bound vs I/O-bound operations
- Knowledge of race conditions in concurrent systems

---

## Common Mistakes / Edge Cases

1. **Forgetting `await`**: `const user = adminDetails.findOne()` returns a Promise, not the user. All subsequent code fails silently.
2. **`await` in `forEach`**: `array.forEach(async (item) => { await ... })` doesn't wait for all iterations. Use `for...of` or `Promise.all(array.map(...))`.
3. **Error swallowing**: `catch(e) { console.log(e) }` without re-throwing or returning an error response leaves the request hanging.
4. **Unhandled rejection in callback**: Mongoose callbacks (`.then()/.catch()`) inside an async function — the async try-catch doesn't catch them.
5. **Memory leak**: Not closing MongoDB connections in scripts like `admin-seeder.js`. The seeder correctly calls `mongoose.connection.close()` in `finally`.
