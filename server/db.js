
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.log("MongoDB URI is missing in .env");
      return;
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
  }
};

module.exports = connectDB;
