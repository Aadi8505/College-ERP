const User = require("./models/user.model");
const connectToMongo = require("./Database/db");
const mongoose = require("mongoose");

const deleteAllStudents = async () => {
  try {
    await connectToMongo();

    console.log("🔄 Connecting to database...");

    const result = await User.deleteMany({ role: "student" });

    console.log(
      `\n✅ Successfully deleted ${result.deletedCount} students from the database!`,
    );
    console.log("\n✨ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error while deleting students:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

deleteAllStudents();
