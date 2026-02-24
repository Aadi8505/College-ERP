const connectToMongo = require("./database/db");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
connectToMongo();

const port = process.env.PORT || 4000;

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_API_LINK,
    credentials: true,
  })
);

// API routes FIRST
app.use("/api/admin", require("./routes/details/admin-details.route"));
app.use("/api/faculty", require("./routes/details/faculty-details.route"));
app.use("/api/student", require("./routes/details/student-details.route"));
app.use("/api/branch", require("./routes/branch.route"));
app.use("/api/subject", require("./routes/subject.route"));
app.use("/api/notice", require("./routes/notice.route"));
app.use("/api/timetable", require("./routes/timetable.route"));
app.use("/api/material", require("./routes/material.route"));
app.use("/api/exam", require("./routes/exam.route"));
app.use("/api/marks", require("./routes/marks.route"));

app.use("/media", express.static(path.join(__dirname, "media")));

// Serve React build LAST
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});