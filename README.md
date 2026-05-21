# 🎓 College ERP — Advanced College Management System

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/mern-stack)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-lightgrey.svg?style=for-the-badge&logo=cloudinary)](https://cloudinary.com)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT-orange.svg?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A modern, highly secure, and feature-rich Enterprise Resource Planning (ERP) platform designed for educational institutions. Built on the MERN (MongoDB, Express, React, Node.js) stack, this application centralizes administrative, faculty, and student operations into a unified dashboard experience with robust Cloudinary asset management, streamlined batch organization, and role-based access control.

---

## 🌟 Live Demo Preview

Experience the platform immediately! A pre-configured student preview account has been set up for visitors to explore the dashboards, check academic profiles, view exam schedules, and download course materials.

> ### **Demo Credentials**
> * 👤 **Role:** Student Viewer
> * 📧 **Email:** `demo@gmail.com`
> * 🔑 **Password:** `student123`

---

## 📅 Table of Contents

1. [Architectural Overhauls & Upgrades](#-architectural-overhauls--upgrades)
2. [Dashboard Features](#-dashboard-features)
3. [Technology Stack](#%EF%B8%8F-technology-stack)
4. [Project Structure](#%EF%B8%8F-project-structure)
5. [Prerequisites](#-prerequisites)
6. [Local Environment & Setup](#%EF%B8%8F-local-environment--setup)
7. [Database Initialization & Seeders](#-database-initialization--seeders)
8. [License](#-license)

---

## 🔄 Architectural Overhauls & Upgrades

The codebase has undergone substantial restructuring and optimization to transform it from a basic prototype into a production-grade academic ERP:

1. **Unified User Schema & Role-Based Access Control (RBAC)**
   * **The Change:** Consolidated three separate, fragmented database models (`AdminDetails`, `FacultyDetails`, `StudentDetails`) into a single, highly performant `User` collection.
   * **Security:** Implemented backend `requireRole` middleware. All write/delete/update operations are protected with role verification (Admin, Faculty, Student), blocking unauthorized API access.

2. **Automated Roll Number Generation**
   * **The Change:** Replaced manual enrollment number input with automated, sequential roll number generation (e.g., `CSE101`, `ECE101`, `BCA102`).
   * **How it works:** When registering a new student, the system fetches the branch identifier, scans the database for the highest serial number, and increments it automatically, guaranteeing zero duplicates.

3. **Cloud-Based Asset Management (Cloudinary CDN)**
   * **The Change:** Integrated **Cloudinary** for scalable, high-speed delivery of lecture notes, study materials, timetables, and exam schedules.
   * **Stability:** Retains dynamic, local Multer filesystem creation as a fallback to prevent production crashes on hosting platforms like Render.

4. **Semester-to-Batch ERP Migration**
   * **The Change:** Transitioned all academic resource assignments (timetables, course materials, exams, grades) from dynamic "Semesters" to static "Batches" (e.g., `23`, `24`, `25`, `26`).
   * **Rationale:** Aligns with modern university ERP architectures where documents stay attached to a student's graduating batch throughout their academic lifecycle, avoiding the need to migrate files every six months.

5. **UI Stability & Crash Prevention**
   * **The Change:** Added deep optional chaining (`?.`) and fallback placeholders (`|| "N/A"`) on all profile cards and dashboards.
   * **The Fix:** Prevented React render crashes due to unpopulated fields (e.g., salary, emergency contact details) and secured date-string formatting methods.

6. **Dual-Layer Frontend Security**
   * **The Change:** Implemented `ProtectedRoute` wrappers around React Router.
   * **Stability:** Added lazy-loading states to dashboard homepages; no structural menus or sub-components are displayed until the client JWT is validated by the `/auth/my-details` backend API, preventing layout flashes.

---

## 💻 Dashboard Features

### 🔑 Administrator Dashboard
* **User Management:** Create, view, update, and delete Admin, Faculty, and Student accounts. Roll numbers are generated automatically on student creation.
* **Academic Control:** Register and configure departments/branches, academic subjects, and course structures.
* **Timetable Coordinator:** Upload timetable sheets assigned specifically by Branch and graduation Batch.
* **Notices Board:** Author and broadcast campus-wide notices.
* **Profile Manager:** Update administrative details and change login credentials.

### 👨‍🏫 Faculty Dashboard
* **Cloud Study Materials:** Upload, organize, and categorize lecture notes, assignment sheets, and course syllabi directly to Cloudinary.
* **Student Finder:** Search the unified student database by Branch, Batch, name, or roll number to review details.
* **Grade Management:** Filter students dynamically by subject and batch to input, update, and submit exam marks.
* **Personal Profile:** Safely edit emergency contacts and review salary/payroll numbers.

### 🎓 Student Dashboard
* **Academic Hub:** View student profile details, registered Branch, and active Batch.
* **Materials Locker:** Access, filter, and download study guides, lecture notes, and assignments uploaded by faculty.
* **Timetable Previewer:** View and download batch-specific class timetables.
* **Grades & Marks:** Track graded performance across different exams filtered by Batch.
* **Notices Feed:** Read up-to-date notifications and announcements from college administration.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, React Router v6, Context API, Vanilla CSS (Premium responsive themes), Tailwind CSS
* **Backend:** Node.js, Express.js (REST API, MVC structure)
* **Database:** MongoDB, Mongoose ODM
* **Cloud Storage:** Cloudinary SDK (Media and Document hosting)
* **Auth & Security:** JSON Web Tokens (JWT), bcrypt.js (Password hashing), CORS
* **Notifications:** Nodemailer (SMTP password reset services)

---

## 📂 Project Structure

```text
college-management-system/
├── backend/
│   ├── Database/            # MongoDB connection configuration
│   ├── controllers/         # Unified User, Notice, Timetable, Material, Exam, and Marks controllers
│   ├── models/              # User (unified roles), Branch, Subject, Timetable, Material, Exam, Marks schemas
│   ├── routes/              # Express Router files (auth, users, branches, subjects, notices, etc.)
│   ├── middlewares/         # JWT parsing, RBAC (requireRole), and Multer file handlers
│   ├── utils/               # Cloudinary integrations and helper functions
│   ├── admin-seeder.js      # Seed file for initial Admin creation
│   └── index.js             # Express application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI elements and ProtectedRoute guard
│   │   ├── Screens/         # Separate Admin, Faculty, and Student screen trees
│   │   ├── context/         # AuthState provider and global context
│   │   └── App.js           # React Router and application layout
│   └── package.json
└── README.md
```

---

## 📋 Prerequisites

Before running the application locally, ensure you have installed:
* **Node.js** (v14+ recommended)
* **MongoDB** (Local instance or MongoDB Atlas cluster connection)
* **npm** (Node package manager)

---

## ⚙️ Local Environment & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd College-Management-System
```

### 2. Install Project Dependencies
Run install in both root folders:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Backend Environment Variables
Create a file named `.env` in the `backend/` directory with the following variables:
```env
# Database & Server Setup
MONGODB_URI=mongodb://127.0.0.1:27017/College-Management-System
PORT=4000
FRONTEND_API_LINK=http://localhost:3000
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Nodemailer Setup (Optional for password reset)
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASS=your-gmail-app-password
```

### 4. Frontend Environment Variables
Create a file named `.env` in the `frontend/` directory with the following variables:
```env
REACT_APP_APILINK=http://localhost:4000/api
REACT_APP_MEDIA_LINK=http://localhost:4000/media
```

### 5. Running the Application
Open two separate terminal windows:

* **Terminal 1: Start Backend Server**
  ```bash
  cd backend
  npm run dev
  ```
* **Terminal 2: Start Frontend Server**
  ```bash
  cd frontend
  npm start
  ```

---

## 🗄️ Database Initialization & Seeders

To log in for the first time, you must seed the database with an Admin account. Make sure your local MongoDB instance is running, or that your Atlas URI is connected in `backend/.env`.

1. **Seed the Admin account:**
   ```bash
   cd backend
   npm run seed
   ```
   *(Ensure you have `"seed": "node admin-seeder.js"` configured in your `backend/package.json` scripts)*

2. **Use these default credentials to log in as Admin:**
   * 📧 **Email:** `admin@gmail.com`
   * 🔑 **Password:** `admin123`
   * 🆔 **Employee ID:** `123456`

---

## 📝 License

This project is licensed under the [MIT License](LICENSE). Feel free to customize and expand it!
