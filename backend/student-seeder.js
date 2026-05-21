const User = require("./models/user.model");
const Branch = require("./models/branch.model");
const connectToMongo = require("./Database/db");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Email list from the attachment
const emails = [
  "bhoomi1157.be23@chitkarauniversity.edu.in",
  "bhoomika1158.be23@chitkarauniversity.edu.in",
  "brinda1161.be23@chitkarauniversity.edu.in",
  "chetan1163.be23@chitkarauniversity.edu.in",
  "chinmay1164.be23@chitkarauniversity.edu.in",
  "chirag1167.be23@chitkarauniversity.edu.in",
  "daksh1169.be23@chitkarauniversity.edu.in",
  "deepak1175.be23@chitkarauniversity.edu.in",
  "deepak1173.be23@chitkarauniversity.edu.in",
  "deepak1174.be23@chitkarauniversity.edu.in",
  "deepanshi1176.be23@chitkarauniversity.edu.in",
  "deepanshu1178.be23@chitkarauniversity.edu.in",
  "deepanshi1177.be23@chitkarauniversity.edu.in",
  "deepanshi1179.be23@chitkarauniversity.edu.in",
  "deesh1180.be23@chitkarauniversity.edu.in",
  "devang1181.be23@chitkarauniversity.edu.in",
  "dharambir1186.be23@chitkarauniversity.edu.in",
  "dhruv1187.be23@chitkarauniversity.edu.in",
  "dishant1188.be23@chitkarauniversity.edu.in",
  "diwanshu1618.be23@chitkarauniversity.edu.in",
  "diya1193.be23@chitkarauniversity.edu.in",
  "diya1194.be23@chitkarauniversity.edu.in",
  "diya1195.be23@chitkarauniversity.edu.in",
  "drishty1197.be23@chitkarauniversity.edu.in",
  "garvit1199.be23@chitkarauniversity.edu.in",
  "gaurav1201.be23@chitkarauniversity.edu.in",
  "gautam1203.be23@chitkarauniversity.edu.in",
  "gautam1204.be23@chitkarauniversity.edu.in",
  "geetansha1206.be23@chitkarauniversity.edu.in",
  "gourav1207.be23@chitkarauniversity.edu.in",
  "gouri1208.be23@chitkarauniversity.edu.in",
  "gurdev1210.be23@chitkarauniversity.edu.in",
  "harash1215.be23@chitkarauniversity.edu.in",
  "hardik1216.be23@chitkarauniversity.edu.in",
  "hari1217.be23@chitkarauniversity.edu.in",
  "harjinder1218.be23@chitkarauniversity.edu.in",
  "harsh1222.be23@chitkarauniversity.edu.in",
  "harsh1223.be23@chitkarauniversity.edu.in",
  "harshit1230.be23@chitkarauniversity.edu.in",
  "harshit1232.be23@chitkarauniversity.edu.in",
  "harshita1235.be23@chitkarauniversity.edu.in",
  "harshita1236.be23@chitkarauniversity.edu.in",
  "harswardhan1237.be23@chitkarauniversity.edu.in",
  "hemanshu1238.be23@chitkarauniversity.edu.in",
  "hement1239.be23@chitkarauniversity.edu.in",
  "himanshu1242.be23@chitkarauniversity.edu.in",
  "ishant1248.be23@chitkarauniversity.edu.in",
  "ishika1251.be23@chitkarauniversity.edu.in",
  "jaideep1252.be23@chitkarauniversity.edu.in",
  "janvi1253.be23@chitkarauniversity.edu.in",
  "jaspreet1254.be23@chitkarauniversity.edu.in",
  "jatin1255.be23@chitkarauniversity.edu.in",
  "jatin1256.be23@chitkarauniversity.edu.in",
  "jatin1257.be23@chitkarauniversity.edu.in",
  "jitashi1260.be23@chitkarauniversity.edu.in",
  "joginder1262.be23@chitkarauniversity.edu.in",
  "kamakshi1265.be23@chitkarauniversity.edu.in",
  "kapil1268.be23@chitkarauniversity.edu.in",
  "karan1269.be23@chitkarauniversity.edu.in",
  "karan1270.be23@chitkarauniversity.edu.in",
  "karan1271.be23@chitkarauniversity.edu.in",
  "kartikey1305.be23@chitkarauniversity.edu.in",
  "kashish1276.be23@chitkarauniversity.edu.in",
  "kashish1277.be23@chitkarauniversity.edu.in",
  // New emails from attachment
  "neraj1175.be23@chitkarauniversity.edu.in",
  "mallish1178.be23@chitkarauniversity.edu.in",
  "mayank1179.be23@chitkarauniversity.edu.in",
  "meena1180.be23@chitkarauniversity.edu.in",
  "mesha1181.be23@chitkarauniversity.edu.in",
  "micky1182.be23@chitkarauniversity.edu.in",
  "mishra1183.be23@chitkarauniversity.edu.in",
  "mohan1184.be23@chitkarauniversity.edu.in",
  "mohan1185.be23@chitkarauniversity.edu.in",
  "monali1186.be23@chitkarauniversity.edu.in",
  "monica1187.be23@chitkarauniversity.edu.in",
  "mool1188.be23@chitkarauniversity.edu.in",
  "mridha1189.be23@chitkarauniversity.edu.in",
  "mrinalni1190.be23@chitkarauniversity.edu.in",
  "naman1191.be23@chitkarauniversity.edu.in",
  "naman1192.be23@chitkarauniversity.edu.in",
  "nancy1193.be23@chitkarauniversity.edu.in",
  "nanit1194.be23@chitkarauniversity.edu.in",
  "naresh1195.be23@chitkarauniversity.edu.in",
  "narendra1196.be23@chitkarauniversity.edu.in",
  "nayankumar1197.be23@chitkarauniversity.edu.in",
  "nidhi1198.be23@chitkarauniversity.edu.in",
  "nidhi1199.be23@chitkarauniversity.edu.in",
  "nihal1200.be23@chitkarauniversity.edu.in",
  "nikhil1201.be23@chitkarauniversity.edu.in",
  "nikita1202.be23@chitkarauniversity.edu.in",
  "nikita1203.be23@chitkarauniversity.edu.in",
  "nishant1204.be23@chitkarauniversity.edu.in",
  "nishant1205.be23@chitkarauniversity.edu.in",
  "nishita1206.be23@chitkarauniversity.edu.in",
  "nipun1207.be23@chitkarauniversity.edu.in",
  "nivedita1208.be23@chitkarauniversity.edu.in",
  "nitya1209.be23@chitkarauniversity.edu.in",
  "nivedita1210.be23@chitkarauniversity.edu.in",
  "nivedita1211.be23@chitkarauniversity.edu.in",
  "nivedita1212.be23@chitkarauniversity.edu.in",
  "amanat1564.be23@chitkarauniversity.edu.in",
  "amandeep1565.be23@chitkarauniversity.edu.in",
  "amar1566.be23@chitkarauniversity.edu.in",
  "amar1567.be23@chitkarauniversity.edu.in",
  "aman1568.be23@chitkarauniversity.edu.in",
  "aman1569.be23@chitkarauniversity.edu.in",
  "aman1570.be23@chitkarauniversity.edu.in",
  "ambar1571.be23@chitkarauniversity.edu.in",
  "ambika1572.be23@chitkarauniversity.edu.in",
  "amrita1573.be23@chitkarauniversity.edu.in",
  "amrita1574.be23@chitkarauniversity.edu.in",
  "amrita1575.be23@chitkarauniversity.edu.in",
  "amrita1576.be23@chitkarauniversity.edu.in",
  "amrita1577.be23@chitkarauniversity.edu.in",
  // Additional emails from attachment
  "aanchal1006.be23@chitkarauniversity.edu.in",
  "aaryan1009.be23@chitkarauniversity.edu.in",
  "aaryan1010.be23@chitkarauniversity.edu.in",
  "aashray1011.be23@chitkarauniversity.edu.in",
  "aayush1013.be23@chitkarauniversity.edu.in",
  "aayush1014.be23@chitkarauniversity.edu.in",
  "abhay1015.be23@chitkarauniversity.edu.in",
  "abhinandan1019.be23@chitkarauniversity.edu.in",
  "abhinandan1020.be23@chitkarauniversity.edu.in",
  "abhishek1026.be23@chitkarauniversity.edu.in",
  "abhishek1028.be23@chitkarauniversity.edu.in",
  "abhishek1030.be23@chitkarauniversity.edu.in",
  "adesh1031.be23@chitkarauniversity.edu.in",
  "adil1032.be23@chitkarauniversity.edu.in",
  "aditya1034.be23@chitkarauniversity.edu.in",
  "aditya1035.be23@chitkarauniversity.edu.in",
  "aditya1036.be23@chitkarauniversity.edu.in",
  "aditya1037.be23@chitkarauniversity.edu.in",
  "aditya1038.be23@chitkarauniversity.edu.in",
  "aditya1039.be23@chitkarauniversity.edu.in",
  "aditya1041.be23@chitkarauniversity.edu.in",
  "agam1042.be23@chitkarauniversity.edu.in",
  "akash1043.be23@chitkarauniversity.edu.in",
  "akhand1044.be23@chitkarauniversity.edu.in",
  "akhilesh1045.be23@chitkarauniversity.edu.in",
  "akshad1047.be23@chitkarauniversity.edu.in",
  "akshat1048.be23@chitkarauniversity.edu.in",
  "akshat1049.be23@chitkarauniversity.edu.in",
  "akshay1051.be23@chitkarauniversity.edu.in",
  "akshit1052.be23@chitkarauniversity.edu.in",
  "alisha1054.be23@chitkarauniversity.edu.in",
  "amar1057.be23@chitkarauniversity.edu.in",
  "amit1058.be23@chitkarauniversity.edu.in",
  "amita1061.be23@chitkarauniversity.edu.in",
  "amritansh1062.be23@chitkarauniversity.edu.in",
  "anchita1067.be23@chitkarauniversity.edu.in",
  "anish1074.be23@chitkarauniversity.edu.in",
  "ankit1075.be23@chitkarauniversity.edu.in",
  "ankit1077.be23@chitkarauniversity.edu.in",
  "ankit1078.be23@chitkarauniversity.edu.in",
  "ankit1079.be23@chitkarauniversity.edu.in",
  "anmol1081.be23@chitkarauniversity.edu.in",
  "anmol1084.be23@chitkarauniversity.edu.in",
  "annanya1086.be23@chitkarauniversity.edu.in",
  "ansh1087.be23@chitkarauniversity.edu.in",
  "ansh1089.be23@chitkarauniversity.edu.in",
  "anshul1093.be23@chitkarauniversity.edu.in",
  "anshul1094.be23@chitkarauniversity.edu.in",
  "anshul1096.be23@chitkarauniversity.edu.in",
  "anshul1097.be23@chitkarauniversity.edu.in",
  "anubhav1098.be23@chitkarauniversity.edu.in",
  "anubhav1099.be23@chitkarauniversity.edu.in",
  "anurag1101.be23@chitkarauniversity.edu.in",
  "anurag1102.be23@chitkarauniversity.edu.in",
  "anurag1103.be23@chitkarauniversity.edu.in",
  "anushi1104.be23@chitkarauniversity.edu.in",
  "areen1106.be23@chitkarauniversity.edu.in",
  "arjita1109.be23@chitkarauniversity.edu.in",
  "arpita1110.be23@chitkarauniversity.edu.in",
  "arshveer1112.be23@chitkarauniversity.edu.in",
  "aru1113.be23@chitkarauniversity.edu.in",
  "aruhl1115.be23@chitkarauniversity.edu.in",
  "aryaman1116.be23@chitkarauniversity.edu.in",
  "aryan1117.be23@chitkarauniversity.edu.in",
  "aryan1118.be23@chitkarauniversity.edu.in",
  "aryan1120.be23@chitkarauniversity.edu.in",
  "aryan1121.be23@chitkarauniversity.edu.in",
  "aryan1122.be23@chitkarauniversity.edu.in",
  "aryan1123.be23@chitkarauniversity.edu.in",
  "aryan1124.be23@chitkarauniversity.edu.in",
  "aryan1125.be23@chitkarauniversity.edu.in",
  "ashish1128.be23@chitkarauniversity.edu.in",
  "ashna1129.be23@chitkarauniversity.edu.in",
  "ashok1130.be23@chitkarauniversity.edu.in",
  "ashosh1131.be23@chitkarauniversity.edu.in",
  "brahmjot1160.be23@chitkarauniversity.edu.in",
  "karan1272.be23@chitkarauniversity.edu.in",
  "sumit1522.be23@chitkarauniversity.edu.in",
  "vishal1594.be23@chitkarauniversity.edu.in",
];

// Common courses/branches
const branches = ["BCA", "CSE", "BPH"];
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
  "Desai",
  "Agarwal",
  "Iyer",
  "Menon",
  "Trivedi",
  "Dwivedi",
  "Mishra",
  "Tiwari",
  "Chakraborty",
  "Banerjee",
  "Bhat",
  "Yadav",
  "Saxena",
  "Chopra",
  "Kapoor",
  "Malhotra",
  "Arora",
  "Khanna",
  "Bose",
  "Chatterjee",
  "Dasgupta",
  "Ghosh",
  "Mukherjee",
  "Roy",
  "Bhattacharya",
  "Dutta",
  "Hossain",
  "Khan",
  "Ahmad",
  "Sultana",
  "Prabhu",
  "Rao",
  "Sundaram",
  "Krishnan",
  "Subramaniam",
  "Raman",
  "Mathew",
  "Jacob",
  "Thomas",
  "George",
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
  const start = new Date(2000, 0, 1);
  const end = new Date(2006, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

const extractFirstName = (email) => {
  // Extract name from email before the numbers
  // e.g., "aditya1034" -> "aditya"
  const match = email.match(/^([a-zA-Z]+)/);
  return match
    ? match[1].charAt(0).toUpperCase() + match[1].slice(1)
    : "Student";
};

const generateRollNumber = (batch, branchId, studentNumberPerBatch) => {
  // Format: CSE23-01 (Department + YearJoined + SequentialNumber per branch-batch)
  // Ensures consistent numbering: CSE23-01, CSE23-02, CSE23-03, etc.
  return `${branchId}${batch}-${String(studentNumberPerBatch).padStart(2, "0")}`;
};

const seedStudents = async () => {
  try {
    await connectToMongo();

    console.log("🔄 Connecting to database...");

    // Get all branches
    const allBranches = await Branch.find();
    if (allBranches.length === 0) {
      console.log("❌ No branches found. Creating sample branches...");

      const sampleBranches = [
        { name: "Computer Science & Engineering", branchId: "CSE" },
        { name: "Electronics & Communication Engineering", branchId: "ECE" },
        { name: "Mechanical Engineering", branchId: "ME" },
        { name: "Civil Engineering", branchId: "CE" },
        { name: "Electrical Engineering", branchId: "EE" },
      ];

      await Branch.insertMany(sampleBranches);
      console.log("✅ Sample branches created!");
    }

    const branchesData = await Branch.find();
    console.log(`✅ Found ${branchesData.length} branches`);

    // Delete existing students to avoid duplicate key errors
    await User.deleteMany({ role: "student" });
    console.log("🗑️  Cleared existing students");

    const studentsToCreate = [];
    const password = "student123"; // Default password for all students
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password before bulk insert

    // Track roll number counter per branch-batch combination
    const rollNumberCounters = {};

    emails.forEach((email, index) => {
      const firstName = extractFirstName(email);
      const lastName = lastNames[index % lastNames.length];
      const branch = branchesData[index % branchesData.length];
      const batch = [23, 24, 25, 26][index % 4]; // Batch years: 23, 24, 25, 26 (4-year course)
      const gender = genders[index % genders.length];

      // Create unique key for branch-batch combination
      const branchBatchKey = `${branch.branchId}-${batch}`;

      // Increment counter for this branch-batch combination
      if (!rollNumberCounters[branchBatchKey]) {
        rollNumberCounters[branchBatchKey] = 1;
      } else {
        rollNumberCounters[branchBatchKey]++;
      }

      const studentData = {
        role: "student",
        email: email.toLowerCase().trim(),
        firstName: firstName,
        middleName: "",
        lastName: lastName,
        phone: generateRandomPhone(),
        gender: gender,
        dob: generateRandomDOB(),
        profile: null,
        bloodGroup: bloodGroups[index % bloodGroups.length],
        address: `${index} College Avenue`,
        city: cities[index % cities.length],
        state: states[index % states.length],
        pincode: "160055",
        country: "India",
        branchId: branch._id,
        batch: batch,
        rollNumber: generateRollNumber(
          batch,
          branch.branchId,
          rollNumberCounters[branchBatchKey],
        ),
        status: "active",
        emergencyContact: {
          name: `Emergency ${lastName}`,
          relationship: "Parent",
          phone: generateRandomPhone(),
        },
        password: hashedPassword,
      };

      studentsToCreate.push(studentData);
    });

    // Insert all students
    const result = await User.insertMany(studentsToCreate, { ordered: false });
    console.log(
      `\n✅ Successfully added ${result.length} students to the database!`,
    );

    // Summary
    console.log("\n📊 Seeding Summary:");
    console.log(`   Total Students Added: ${result.length}`);
    console.log(`   Default Password: ${password}`);
    console.log(`   Batch Years: 23, 24, 25, 26 (4-year course format)`);
    console.log(
      `   Roll Number Format: DEP{YY}-{NUM} (e.g., CSE23-01, BCA24-02)`,
    );
    console.log(
      `   Branches Used: ${branchesData.map((b) => b.branchId).join(", ")}`,
    );
    console.log("\n✨ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error while seeding:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedStudents();
