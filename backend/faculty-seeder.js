const User = require("./models/user.model");
const Branch = require("./models/branch.model");
const connectToMongo = require("./Database/db");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Faculty emails - 4 per branch (12 total)
const facultyEmails = {
  BCA: [
    "prof.rajesh.kumar@chitkarauniversity.edu.in",
    "prof.sneha.verma@chitkarauniversity.edu.in",
    "prof.vikram.singh@chitkarauniversity.edu.in",
    "prof.priya.sharma@chitkarauniversity.edu.in",
  ],
  CSE: [
    "prof.amit.patel@chitkarauniversity.edu.in",
    "prof.neha.gupta@chitkarauniversity.edu.in",
    "prof.arjun.rao@chitkarauniversity.edu.in",
    "prof.divya.nair@chitkarauniversity.edu.in",
  ],
  BPH: [
    "prof.suresh.menon@chitkarauniversity.edu.in",
    "prof.ananya.desai@chitkarauniversity.edu.in",
    "prof.rohit.agarwal@chitkarauniversity.edu.in",
    "prof.deepika.iyer@chitkarauniversity.edu.in",
  ],
};

const lastNames = [
  "Singh",
  "Kumar",
  "Sharma",
  "Patel",
  "Gupta",
  "Rao",
  "Verma",
  "Nair",
  "Pandey",
  "Joshi",
  "Reddy",
  "Sinha",
];

const cities = [
  "Mohali",
  "Chandigarh",
  "Panchkula",
  "Noida",
  "Delhi",
  "Gurgaon",
  "Bangalore",
];

const states = ["Punjab", "Haryana", "Delhi", "NCR"];
const genders = ["male", "female"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Helper functions
const generateRandomPhone = () => {
  return (
    "9" +
    Math.floor(Math.random() * 999999999)
      .toString()
      .padStart(9, "0")
  );
};

const generateRandomDOB = () => {
  const start = new Date(1975, 0, 1);
  const end = new Date(1995, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

const extractFirstName = (email) => {
  // Extract name from email after "prof." prefix
  // e.g., "prof.rajesh.kumar@..." -> "Rajesh"
  const match = email.match(/prof\.([a-zA-Z]+)\./);
  return match
    ? match[1].charAt(0).toUpperCase() + match[1].slice(1)
    : "Faculty";
};

const extractLastName = (email) => {
  // Extract last name from faculty email
  // e.g., "prof.rajesh.kumar@..." -> "Kumar"
  const match = email.match(/prof\.([a-zA-Z]+)\.([a-zA-Z]+)@/);
  return match
    ? match[2].charAt(0).toUpperCase() + match[2].slice(1)
    : "Faculty";
};

const seedFaculty = async () => {
  try {
    await connectToMongo();

    console.log("🔄 Connecting to database...");

    // Get all branches
    const allBranches = await Branch.find();
    if (allBranches.length === 0) {
      console.log("❌ No branches found. Creating sample branches...");

      const sampleBranches = [
        { name: "Bachelor of Computer Applications", branchId: "BCA" },
        { name: "Computer Science & Engineering", branchId: "CSE" },
        { name: "Bachelor of Pharmacy", branchId: "BPH" },
      ];

      await Branch.insertMany(sampleBranches);
      console.log("✅ Sample branches created!");
    }

    const branchesData = await Branch.find();
    console.log(`✅ Found ${branchesData.length} branches`);

    // Delete existing faculty to avoid duplicate key errors
    await User.deleteMany({ role: "faculty" });
    console.log("🗑️  Cleared existing faculty");

    const facultyToCreate = [];
    const password = "faculty123"; // Default password for all faculty
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password before bulk insert

    // Create faculty for each branch
    branchesData.forEach((branch) => {
      const branchEmails = facultyEmails[branch.branchId] || [];

      branchEmails.forEach((email, index) => {
        const firstName = extractFirstName(email);
        const lastName = extractLastName(email);
        const gender = genders[index % genders.length];

        const facultyData = {
          role: "faculty",
          email: email.toLowerCase().trim(),
          firstName: firstName,
          middleName: "",
          lastName: lastName,
          phone: generateRandomPhone(),
          gender: gender,
          dob: generateRandomDOB(),
          profile: null,
          bloodGroup: bloodGroups[index % bloodGroups.length],
          address: `Faculty Quarters, ${branch.branchId}`,
          city: cities[index % cities.length],
          state: states[index % states.length],
          pincode: "160055",
          country: "India",
          branchId: branch._id,
          status: "active",
          emergencyContact: {
            name: `Emergency ${lastName}`,
            relationship: "Spouse",
            phone: generateRandomPhone(),
          },
          password: hashedPassword,
        };

        facultyToCreate.push(facultyData);
      });
    });

    // Insert all faculty
    const result = await User.insertMany(facultyToCreate, { ordered: false });
    console.log(
      `\n✅ Successfully added ${result.length} faculty to the database!`,
    );

    // Summary
    console.log("\n📊 Faculty Seeding Summary:");
    console.log(`   Total Faculty Added: ${result.length}`);
    console.log(`   Faculty per Branch: 4`);
    console.log(
      `   Branches: ${branchesData.map((b) => b.branchId).join(", ")}`,
    );
    console.log(`   Default Password: ${password}`);
    console.log("\n✨ Faculty seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error while seeding faculty:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedFaculty();
