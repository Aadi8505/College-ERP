# 🔧 DEPLOYMENT TROUBLESHOOTING GUIDE

## Common Issues & Solutions

---

## ❌ ERROR 1: "Cannot Connect to Backend"

### What You See:
```
Error: Network Error
Failed to fetch from https://college-management-backend-xxxxx.render.com
Status: 0 (Network Error)
```

### How to Fix:

**Step 1**: Check if backend is running
```
Go to Render Dashboard → Backend Service
Look for GREEN indicator (running) or RED (crashed)
```

**Step 2**: Copy correct backend URL
```
✅ Correct format: https://college-management-backend-xxxxx.render.com
❌ Wrong: college-management-backend.render.com (missing https)
❌ Wrong: localhost:4000 (won't work in production)
```

**Step 3**: Update frontend environment
```
Frontend Service → Settings → Environment Variables
Update: REACT_APP_API_URL = https://college-management-backend-xxxxx.render.com
```

**Step 4**: Redeploy frontend
```
Frontend Service → Manual Deploy → Deploy latest commit
Wait 5-10 minutes
```

**Step 5**: Clear browser cache
```
Windows: Ctrl + Shift + Delete
Mac: Cmd + Shift + Delete
Select "All time" → Clear
```

---

## ❌ ERROR 2: CORS Error

### What You See:
```javascript
Access to XMLHttpRequest at 'https://college-management-backend.render.com/api/student' 
from origin 'https://college-management-frontend.render.com' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### How to Fix:

**Step 1**: Open `backend/app.js`

Find this code (usually at top, after imports):
```javascript
app.use(cors());
```

**Step 2**: Replace with this:
```javascript
const cors = require('cors');

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',                              // Local development
  'https://college-management-frontend.render.com',     // Render production
  'https://college-management-frontend.vercel.app'      // If using Vercel
];

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Step 3**: Update frontend URL in the code
```javascript
// Find these lines and replace with YOUR actual URL
// FROM:
'https://college-management-frontend.render.com'

// TO:
'https://college-management-frontend-YOUR-SERVICE-ID.render.com'
```

**Step 4**: Push to GitHub
```bash
cd c:\Users\HP VICTUS\Desktop\College-Management-System
git add backend/app.js
git commit -m "Fix CORS for production"
git push origin main
```

**Step 5**: Redeploy backend
```
Render Dashboard → Backend Service
Click "Manual Deploy"
Wait 5-10 minutes for redeployment
```

---

## ❌ ERROR 3: MongoDB Connection Error

### What You See (in backend logs):
```
MongooseError: Failed to connect to MongoDB
Error: connection failed
ENOTFOUND errors
```

### How to Fix:

**Step 1**: Verify MongoDB connection string

Go to MongoDB Atlas → Clusters → Connect → Application

Copy the string format:
```
mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/college_db?retryWrites=true&w=majority
```

**Step 2**: Check MongoDB credentials
```
❌ Wrong: mongodb+srv://admin:<password>@cluster0...
✅ Right: mongodb+srv://admin:actualPassword123@cluster0...
(Replace <password> with actual password)
```

**Step 3**: Check if special characters are URL-encoded

If your password has special characters:
- `@` → `%40`
- `!` → `%21`
- `:` → `%3A`

Use an [encoder tool](https://www.urlencoder.org/) if unsure

**Step 4**: Check database name
```
✅ Correct: .mongodb.net/college_db?
❌ Wrong: .mongodb.net/?
(Must have database name)
```

**Step 5**: Verify network access

On MongoDB Atlas:
1. Click "Network Access"
2. Look for IP address: `0.0.0.0/0`
3. If not there:
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere"
   - Click "Confirm"

**Step 6**: Update Render environment variable

Render Backend Service → Settings → Environment

Update:
```
MONGODB_URI = (paste your complete connection string)
```

**Step 7**: Redeploy
```
Manual Deploy → Deploy latest commit
Wait 5-10 minutes
Check logs for success
```

---

## ❌ ERROR 4: 500 Error When Registering Student

### What You See:
```
Status: 500 Internal Server Error
Message: Server error
Body: {}
```

### How to Fix:

**Step 1**: Check backend logs

Render Dashboard → Backend Service → Logs

Look for red error messages, copy the exact error

**Step 2**: Common 500 error causes

**Cause A**: Required field is missing
```
Error: "firstName is required"

Fix: In frontend form, check all required fields have values
```

**Cause B**: Database connection error
```
Error: "Cannot connect to MongoDB"

Fix: Check MongoDB connection string (see ERROR 3 above)
```

**Cause C**: File upload error
```
Error: "Cannot read property 'filename' of undefined"

Fix: Already fixed in the code! Check you have latest version
```

**Cause D**: Validation error
```
Error: "Enrollment already exists"

Fix: Use different enrollment number
```

**Step 3**: Submit form again and check logs

Repeat the action → Check backend logs → Look for new error

**Step 4**: If error persists

Copy the exact error from logs and:
1. Paste in Google search
2. Look for same error in Stack Overflow
3. Apply solution and redeploy

---

## ❌ ERROR 5: Photo Upload Not Working

### What You See:
```
Frontend: File selected, but doesn't upload
OR
Status: 400/500 error
Message: "No file uploaded"
```

### How to Fix:

**Step 1**: Check frontend form

Open `frontend/src/Screens/Admin/Student.jsx`

Look for this code:
```javascript
const formDataToSend = new FormData();
formDataToSend.append("profile", formData.profile);  // This line
```

Should have:
```javascript
if (formData.profile) {
  formDataToSend.append("profile", formData.profile);
}
```

**Step 2**: Check Multer middleware

Open `backend/middlewares/multer.middleware.js`

Should look like:
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './media')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });
module.exports = upload;
```

**Step 3**: Make sure media folder exists

On your local machine:
```bash
cd backend
# If media folder doesn't exist:
mkdir media
```

**Step 4**: Check file size limit

Update `backend/middlewares/multer.middleware.js`:
```javascript
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB max
});
```

**Step 5**: Redeploy and test

```bash
git add .
git commit -m "Fix file upload"
git push origin main

# Then on Render:
Manual Deploy → Deploy latest commit
```

---

## ❌ ERROR 6: Frontend Doesn't Load

### What You See:
```
https://college-management-frontend.render.com shows Error
"404 Not Found"
OR blank page
```

### How to Fix:

**Step 1**: Check Render static site deployment

Render Dashboard → Frontend Service → Logs

Look for build errors (red text)

**Step 2**: Verify build command
```
Should be: npm run build
NOT: npm start
```

**Step 3**: Check publish directory
```
Should be: build
NOT: src or public
```

**Step 4**: Verify vercel.json exists

Check if `frontend/vercel.json` exists with content:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

This file tells Render to route all requests to index.html

**Step 5**: Redeploy

```bash
git add .
git commit -m "Fix frontend build"
git push origin main

# Render automatically redeploys
# Wait 5-10 minutes
```

---

## ❌ ERROR 7: Search Not Working

### What You See:
```
Cannot search students
OR
Search returns 500 error
OR
Search returns empty results
```

### How to Fix:

**Step 1**: Check backend logs

Render → Backend Service → Logs

Look for error related to `/student/search`

**Step 2**: Verify search endpoint

Open `backend/routes/details/student-details.route.js`

Should have:
```javascript
router.post('/search', searchStudentsController);
```

**Step 3**: Check search controller

Open `backend/controllers/details/student-details.controller.js`

Look for `searchStudentsController` function - should have logic to:
- Accept optional filters
- Build MongoDB query
- Search database
- Return results

**Step 4**: Test with cURL

```bash
curl -X POST https://college-management-backend.render.com/api/student/search \
  -H "Content-Type: application/json" \
  -d '{"semester": "1"}'
```

Should return array of students (or empty array if none match)

**Step 5**: If still not working

Check if any required database collections are empty:
1. Go to MongoDB Atlas
2. Browse Collections
3. Click studentdetails
4. Should show documents

If empty, create test data by registering a student first

---

## ❌ ERROR 8: "Failed to compile" (Frontend)

### What You See (in build logs):
```
[error] Syntax error in App.js
[error] Module not found: Can't resolve 'axios'
Compilation failed
```

### How to Fix:

**Step 1**: For syntax errors

Open the file mentioned:
```
frontend/src/App.js
```

Look for red squiggly lines, fix the syntax error

**Step 2**: For missing modules

Install the package locally:
```bash
cd frontend
npm install axios
# or whatever package is missing
```

**Step 3**: Push and redeploy

```bash
git add .
git commit -m "Fix frontend compilation errors"
git push origin main

# Render redeploys automatically
```

---

## ✅ Common Working Examples

### Working Backend URL
```
✅ https://college-management-backend-xyz123.render.com
✅ https://my-app-backend.render.com
```

### Working Frontend URL
```
✅ https://college-management-frontend-xyz123.render.com
✅ https://my-app.render.com
```

### Working MongoDB URL
```
✅ mongodb+srv://admin:password123@cluster0.abc123.mongodb.net/college_db?retryWrites=true&w=majority
```

### Working Environment Variable
```
✅ REACT_APP_API_URL=https://college-management-backend-xyz123.render.com
✅ JWT_SECRET=this_is_a_long_random_secret_string_12345
```

---

## 🔍 How to Debug

### Step 1: Browser Console
```
Press F12 → Console tab
Look for red errors
Note exact error message
```

### Step 2: Network Tab
```
Press F12 → Network tab
Try the action that fails
Look for red requests
Click the request
Check Status code and Response
```

### Step 3: Backend Logs
```
Render Dashboard → Backend Service → Logs
Look for timestamps matching your action
Read error messages
```

### Step 4: Search Google
```
Copy exact error message from Step 1 or 2
Google: "error message here"
Usually finds Stack Overflow with solution
```

---

## 📞 Still Stuck?

If none of the above solutions work:

1. **Take a screenshot** of:
   - Browser console (F12)
   - Backend logs from Render
   - The exact error message

2. **Gather information**:
   - What were you doing? (registering, searching, uploading, etc.)
   - What error did you see?
   - Has this ever worked?

3. **Check official docs**:
   - [Render Support](https://render.com/docs)
   - [MongoDB Atlas Troubleshooting](https://docs.mongodb.com/atlas/troubleshoot-connection)
   - [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

## ✅ Quick Health Check

Run this to verify everything is working:

```bash
# 1. Check backend is running
curl https://college-management-backend-xxxxx.render.com

# 2. Check frontend is running
curl https://college-management-frontend-xxxxx.render.com

# 3. Check MongoDB connection
curl -X POST https://college-management-backend-xxxxx.render.com/api/student/search \
  -H "Content-Type: application/json" \
  -d '{}'
```

All should return data (not errors)

---

**Last Updated**: March 16, 2026  
**Version**: 1.0

Good luck! You got this! 🚀
