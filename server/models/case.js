
const mongoose = require("mongoose");

const suspectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  occupation: String
});

const clueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  discovered: {
    type: Boolean,
    default: false
  }
});

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    premise: String,
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy"
    },
    story: String,
    suspects: [suspectSchema],
    clues: [clueSchema],
    culprit: {
      type: String,
      select: false
    },
    hints: [String],
    hintsUsed: {
      type: Number,
      default: 0
    },
    discoveredClues: {
      type: Number,
      default: 0
    },
    accusedSuspect: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Case", caseSchema);
