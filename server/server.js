
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");
const caseRoutes = require("./routes/caseRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Main route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Mystery Room Backend is Running!"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy"
  });
});

// Mystery Case APIs
app.use("/api/cases", caseRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AI Mystery Room Server running on port ${PORT}`);
});
