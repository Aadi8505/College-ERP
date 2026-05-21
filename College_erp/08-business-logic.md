# 08 — Business Logic (Marks, Materials, Timetables, Exams, Student Search)

## What This Covers

The core academic features of the ERP: how marks are managed (individual and bulk), study material uploads with ownership, timetable management, exam creation, and the student search/filter system.

---

## Marks Management

### The Most Complex Feature

Marks involve a multi-entity relationship: **Student × Subject × Exam × Semester**.

```
Faculty selects:  Branch → Semester → Subject → Exam
System loads:     All students in that branch + semester
Faculty enters:   Marks for each student
System:           Creates/updates Marks records (upsert pattern)
```

### Bulk Marks Upload (Upsert Pattern)

```js
const addBulkMarksController = async (req, res) => {
  const { marks, examId, subjectId, semester } = req.body;
  
  const results = [];
  for (const markData of marks) {
    const existingMark = await Marks.findOne({
      studentId: markData.studentId,
      examId, subjectId, semester,
    });

    if (existingMark) {
      existingMark.marksObtained = markData.obtainedMarks;
      await existingMark.save();
      results.push(existingMark);
    } else {
      const newMark = await Marks.create({ ... });
      results.push(newMark);
    }
  }
};
```

### Why Upsert (Find + Update/Create)?

**Problem**: Faculty may re-upload marks (correcting errors). Without upsert, duplicate entries are created.

**Solution**: For each student, check if marks already exist for that exact `(studentId, examId, subjectId, semester)` combination. If yes, update. If no, create.

### Performance Concern: Sequential Loop

The `for` loop makes **N database calls** for N students (plus N findOne queries). For 60 students, that's 120 DB calls.

**Why this is a problem**: Each call has network latency (~5ms for local, ~50ms for Atlas). 60 students = 6–12 seconds.

**Better approach**: Use `bulkWrite()` with upsert:
```js
await Marks.bulkWrite(
  marks.map(m => ({
    updateOne: {
      filter: { studentId: m.studentId, examId, subjectId, semester },
      update: { $set: { marksObtained: m.obtainedMarks } },
      upsert: true
    }
  }))
);
```

This sends ONE request to MongoDB instead of 120.

### Student View: Own Marks Only

```js
const getStudentMarksController = async (req, res) => {
  const studentId = req.userId;  // From auth middleware
  const marks = await Marks.find({ studentId, semester: Number(semester) })
    .populate("subjectId", "name")
    .populate("examId", "name examType totalMarks");
};
```

**Why `req.userId`**: Students can only see their own marks — the ID comes from the JWT, not from a query parameter. This prevents students from viewing others' marks by changing the ID.

### Faculty View: Students with Marks

```js
// Step 1: Find all students in this branch + semester
const students = await Student.find({ branchId: branch, semester });

// Step 2: Find existing marks for these students
const marks = await Marks.find({
  studentId: { $in: students.map(s => s._id) },
  examId, subjectId, semester
});

// Step 3: Merge — students without marks get 0
const studentsWithMarks = students.map(student => ({
  ...student.toObject(),
  obtainedMarks: marks.find(m => m.studentId.toString() === student._id.toString())
    ?.marksObtained || 0,
}));
```

**Why two queries + merge?** We need ALL students (even those without marks yet) so faculty can enter marks for everyone. A single `Marks.find()` would miss students without any marks.

---

## Study Material Management

### Upload Flow

```
Faculty submits form with:
  - title, subject, semester, branch, type (notes/assignment/syllabus/other)
  - file (PDF/image via multer)

Controller:
  - Validates all fields
  - Sets faculty = req.userId (from auth)
  - Creates Material with file name
  - Populates references and returns
```

### Ownership Enforcement

Only the uploading faculty can update or delete their own materials:

```js
if (material.faculty.toString() !== req.userId) {
  return ApiResponse.unauthorized("You are not authorized to update this material").send(res);
}
```

**Why `.toString()`?** `material.faculty` is a Mongoose ObjectId object. `req.userId` is a string from JWT decode. Direct comparison (`===`) fails on different types. `.toString()` normalizes both to strings.

### Dynamic Filtering

```js
const { subject, faculty, semester, branch, type } = req.query;
let query = {};
if (subject) query.subject = subject;
if (faculty) query.faculty = faculty;
// ... build query dynamically
const materials = await Material.find(query).populate("subject").populate("faculty").populate("branch");
```

**Why dynamic query building?** The frontend may filter by any combination: all materials for a subject, all materials by a faculty member, materials of a specific type, etc. Building the query object dynamically avoids N separate endpoints.

---

## Timetable Management

### Upsert on Same Branch + Semester

```js
let timetable = await Timetable.findOne({ semester, branch });
if (timetable) {
  // UPDATE existing timetable
  timetable = await Timetable.findByIdAndUpdate(timetable._id, {
    semester, branch, link: req.file.filename
  }, { new: true });
} else {
  // CREATE new timetable
  timetable = await Timetable.create({ semester, branch, link: req.file.filename });
}
```

**Business logic**: Each (branch, semester) pair can have only ONE timetable. If a new one is uploaded, it replaces the old one.

**Why not use MongoDB's `unique` compound index?** Because the behavior needed is upsert (replace), not reject. A unique index would throw an error on duplicates.

---

## Exam Management

### Simplified CRUD

```js
const addExamController = async (req, res) => {
  const formData = req.body;
  if (req.file) {
    formData.timetableLink = req.file.filename;
  }
  const exam = await Exam.create(formData);
};
```

**Note**: The exam controller spreads `req.body` directly into `create()`. This is a **mass assignment vulnerability** — a malicious user could add extra fields. Other controllers explicitly destructure fields.

### Exam Types

```js
examType: { type: String, required: true, enum: ["mid", "end"] }
```

Only mid-semester and end-semester exams. This is a domain-specific business rule.

---

## Student Search

### Multi-Filter Search

```js
const searchStudentsController = async (req, res) => {
  const { enrollmentNo, name, semester, branch } = req.body;
  let query = {};

  if (enrollmentNo) {
    query.enrollmentNo = Number(String(enrollmentNo).trim());
  }
  if (name) {
    query.$or = [
      { firstName: { $regex: name, $options: "i" } },
      { middleName: { $regex: name, $options: "i" } },
      { lastName: { $regex: name, $options: "i" } },
    ];
  }
  if (semester) query.semester = semester;
  if (branch) query.branchId = branch;

  const students = await studentDetails.find(query)
    .select("-password -__v")
    .populate("branchId")
    .sort({ enrollmentNo: 1 });
};
```

### Key Design Decisions

1. **`$regex` for name search**: Case-insensitive partial matching across first, middle, and last names
2. **`$or` for name fields**: Searching "John" matches anyone with "John" in ANY name field
3. **`$options: "i"`**: Case-insensitive flag — "john" matches "John"
4. **Sorted by enrollment number**: Consistent ordering for results

### Security Risk: Regex Injection

User input is passed directly to `$regex`. A malicious pattern like `(.*){10}` can cause catastrophic backtracking (ReDoS attack).

**Fix**: Escape regex special characters: `name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`

---

## What Could Break If Changed

1. **Remove upsert logic from marks** → Duplicate marks entries for same student/exam combination
2. **Change `req.userId` to `req.body.userId` for student marks** → Students can query others' marks
3. **Remove `.toString()` in ownership check** → ObjectId vs string comparison always fails, nobody can edit materials
4. **Remove `$or` from name search** → Only matches against one name field
5. **Change timetable to always `create()`** → Multiple timetables per branch/semester, UI confusion

---

## Most Likely Interview Questions

**Q: How does the marks system work?**
> Faculty selects branch, semester, subject, and exam. The system loads all students in that branch+semester, along with any existing marks. Faculty enters marks and submits. The backend uses an upsert pattern — for each student, it checks if marks exist for that specific combination and either updates or creates. Students can only view their own marks, identified by the JWT's userId.

**Q: What's the performance issue with bulk marks upload?**
> The current implementation loops through each student sequentially, making two DB calls per student (findOne + save/create). For 60 students, that's 120 DB calls. A better approach is MongoDB's `bulkWrite()` which sends one batched request. This reduces latency from seconds to milliseconds.

**Q: How do you prevent a faculty member from deleting another's material?**
> The material controller compares `material.faculty.toString()` with `req.userId` (from the JWT). If they don't match, it returns a 401 Unauthorized. The faculty ID is set during creation from the auth middleware, not from user input, so it can't be spoofed.

**Q: How does the student search work?**
> It accepts optional filters: enrollment number, name, semester, and branch. The query is built dynamically — only provided filters are added. Name search uses MongoDB's `$regex` with case-insensitive flag across first, middle, and last name fields using `$or`.

---

## Cross/Follow-up Questions

- *Why not use MongoDB transactions for bulk marks?* → Transactions require a replica set. Standalone MongoDB doesn't support them. For a college project, data consistency across individual mark entries isn't critical enough to justify the infrastructure.
- *How would you handle marks revision history?* → Add a `history` array field or a separate `MarksHistory` collection that stores previous values before each update.
- *What happens if a student is deleted but has marks?* → Orphaned marks records remain. Should implement cascading deletes or soft deletes.
- *Why use POST for student search instead of GET with query params?* → The `$or` filter with regex is complex for URL query strings. POST body is more natural, though GET would be more RESTful.

---

## Why This Implementation Matters

Business logic questions reveal if you truly built the project or just followed a tutorial:
- Can you explain WHY the upsert pattern is used?
- Do you know the performance implications of the loop?
- Can you justify the dynamic query building approach?

---

## Common Mistakes / Edge Cases

1. **Marks with 0 vs no marks**: `obtainedMarks || 0` treats actual zero marks as "no marks". Should use `!== undefined` check.
2. **Deleted exam but marks remain**: Marks reference examId but no cascade delete. Populate returns null for exam.
3. **Regex DoS**: Unescaped user input in `$regex` can cause server hangs with crafted patterns.
4. **Branch deleted with students**: Students reference `branchId`. Deleting a branch leaves orphaned references.
5. **Semester as Number**: `req.query.semester` is a string from URL params. Must convert to `Number()` for MongoDB matching.
