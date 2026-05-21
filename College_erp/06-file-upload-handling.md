# 06 — File Upload Handling

## What This Covers

Multer configuration for file uploads, how profile images and academic materials are stored, static file serving, and the tradeoffs of local disk storage.

---

## How File Uploads Work

```
Frontend Form                 Multer Middleware              Controller
────────────                  ────────────────              ──────────
FormData with file   ──►   multer.diskStorage()    ──►    req.file.filename
Content-Type:              saves to ./media/               stores filename
multipart/form-data        renames: Date.now() +           in MongoDB
                           original extension
```

### Multer Configuration

```js
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./media");                              // All files go to /media
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // 1715612345.jpg
  },
});
const upload = multer({ storage: storage });
```

### Why This Naming Strategy?

- `Date.now()` generates a unique timestamp, preventing filename collisions
- `path.extname()` preserves the original file extension (.jpg, .pdf, .png)
- Result: `1715612345.jpg` — unique and sortable by upload time

### Where Files Are Served

```js
app.use("/media", express.static(path.join(__dirname, "media")));
```

Files in `./backend/media/` are accessible at `http://localhost:4000/media/1715612345.jpg`.

---

## Upload Points in the System

| Feature | Route | What's Uploaded | Used By |
|---------|-------|----------------|---------|
| Admin Profile | `POST /api/admin/register` | Profile image | Admin registration form |
| Admin Update | `PATCH /api/admin/:id` | Profile image | Admin edit form |
| Faculty Profile | `POST /api/faculty/register` | Profile image | Admin creating faculty |
| Student Profile | `POST /api/student/register` | Profile image | Admin creating student |
| Timetable | `POST /api/timetable/` | Timetable image/PDF | Faculty uploading schedule |
| Material | `POST /api/material/` | Notes/Assignment PDF | Faculty sharing materials |
| Exam | `POST /api/exam/` | Exam timetable | Admin creating exams |

### How It Works in Routes

```js
// Single file upload with field name "file"
router.post("/register", upload.single("file"), registerAdminController);
router.patch("/:id", auth, upload.single("file"), updateDetailsController);
```

`upload.single("file")` processes ONE file from the form field named `"file"`. The file data is available as `req.file` in the controller.

### How Controllers Handle It

```js
// Registration: file is optional
const profile = req.file ? req.file.filename : null;

// Update: only update if new file provided
if (req.file) {
  updateData.profile = req.file.filename;
}
```

---

## What's Missing (Know These Gaps)

### 1. No File Type Validation

Multer accepts ANY file type. A user could upload `.exe`, `.sh`, or any malicious file.

**Fix**: Add a file filter:
```js
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
```

### 2. No File Size Limit

Users could upload gigabyte-sized files, consuming disk space and memory.

**Fix**: `multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })` — 5MB limit.

### 3. No Old File Cleanup

When a profile image is updated, the old file remains on disk. Over time, orphaned files accumulate.

**Fix**: Before updating, read the old filename, update the record, then `fs.unlink()` the old file.

### 4. No Cloud Storage

Files are stored on the local server disk. In a multi-server deployment, uploads on server A aren't accessible from server B.

**Fix**: Use AWS S3, Cloudinary, or similar cloud storage. Store the URL instead of a local filename.

---

## Tradeoffs: Local Disk vs Cloud Storage

| Aspect | Local Disk (Chosen) | Cloud (S3/Cloudinary) |
|--------|-------------------|---------------------|
| Setup complexity | ✅ Zero config | ⚠️ AWS credentials, SDK setup |
| Cost | ✅ Free | 💰 Pay per storage/transfer |
| Scalability | ❌ Single server only | ✅ CDN, multi-region |
| Backup | ❌ Manual | ✅ Built-in redundancy |
| Performance | ⚠️ Disk I/O bottleneck | ✅ CDN edge delivery |
| Deployment | ❌ Files lost on redeploy | ✅ Persistent |

**Critical deployment issue**: On Render (used for backend), the filesystem is **ephemeral**. Uploaded files are **lost on every deploy**. This is the biggest limitation of the current approach.

---

## What Could Break If Changed

1. **Delete `./media` directory** → All uploads fail with ENOENT error, Express crashes
2. **Change destination path without updating static serve** → Files upload successfully but can't be accessed via URL
3. **Remove `Date.now()` from filename** → Filename collisions; latest upload overwrites previous
4. **Change field name from `"file"` to `"image"`** → Frontend still sends `"file"`, multer ignores it, `req.file` is undefined
5. **Remove `express.static` for `/media`** → Files exist on disk but return 404 to the client

---

## Most Likely Interview Questions

**Q: How do you handle file uploads in your project?**
> We use Multer, an Express middleware for handling `multipart/form-data`. Files are stored on the local disk in a `./media` directory with timestamp-based filenames to prevent collisions. The Express static middleware serves these files at `/media/*` URLs.

**Q: Why did you choose local storage over cloud storage?**
> For simplicity during development. In production, I'd use AWS S3 or Cloudinary because local storage doesn't scale across multiple servers and files are lost on redeployment (Render has ephemeral storage). Cloud storage also provides CDN benefits for faster file delivery.

**Q: What security concerns exist with your file upload setup?**
> There's no file type validation — malicious files could be uploaded. There's no file size limit — large uploads could exhaust disk space. And there's no virus scanning. I'd add a file filter for allowed extensions, a size limit, and ideally store files in a sandboxed cloud bucket.

**Q: How would you handle file uploads at scale?**
> Move to cloud storage (S3), add a CDN (CloudFront) for delivery, implement presigned URLs for direct client-to-S3 uploads (bypassing the server), and add image processing (resize/compress) via a service like Sharp or Lambda.

---

## Cross/Follow-up Questions

- *What is `multipart/form-data`?* → An HTTP content type that allows sending binary data (files) alongside text fields. Regular `application/json` can't handle files.
- *Why `upload.single("file")` vs `upload.array("files")`?* → `single` processes one file per request. `array` handles multiple files. We only need one file per upload.
- *What happens if the upload fails mid-transfer?* → Multer doesn't write partial files. If the request is interrupted, no file is created. But if the file is saved but the DB update fails, you have an orphaned file.

---

## Why This Implementation Matters

File upload questions test:
- Understanding of HTTP multipart encoding
- Awareness of security risks (file type, size, injection)
- Knowledge of cloud storage alternatives
- Ability to reason about production concerns (scaling, persistence)

---

## Common Mistakes / Edge Cases

1. **Sending JSON Content-Type with file** → Multer ignores the file, `req.file` is undefined
2. **File saved but DB fails** → File exists on disk with no database reference (orphaned)
3. **Concurrent uploads with same timestamp** → Extremely rare since `Date.now()` is ms precision, but possible
4. **Large file uploads blocking the event loop** → Multer streams to disk, so it doesn't block, but very large files still consume memory for the buffer
5. **Missing `./media` directory** → First upload fails. Should auto-create with `fs.mkdirSync('./media', { recursive: true })`
