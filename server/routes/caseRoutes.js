
const express = require("express");
const router = express.Router();
const Case = require("../models/case");
const { GoogleGenAI } = require("@google/genai");

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const baseScores = {
  Easy: 100,
  Medium: 150,
  Hard: 200
};

const config = {
  Easy: { suspects: 3, clues: 5, hints: 2 },
  Medium: { suspects: 4, clues: 7, hints: 3 },
  Hard: { suspects: 5, clues: 9, hints: 3 }
};

// GENERATE MYSTERY USING GEMINI AI
async function generateMystery(premise, difficulty) {
  if (!genAI) {
    throw new Error("Gemini API key is missing in Render environment variables.");
  }

  const counts = config[difficulty];

  const prompt = `
You are an expert mystery game creator.

Create an original detective mystery based on:
${premise}

Difficulty: ${difficulty}

Generate exactly:
- ${counts.suspects} suspects
- ${counts.clues} clues
- ${counts.hints} hints

Rules:
1. The story must have one definite culprit.
2. Every suspect must have name, description and occupation.
3. Every clue must have title and description.
4. Clues must logically help identify the culprit.
5. Hints should guide without revealing the culprit.
6. The culprit must be one of the suspects.
7. Keep the mystery logical and consistent.
8. Do not reveal the culprit in the story or clues.

Return only valid JSON with this structure:
{
  "story": "Complete mystery story",
  "suspects": [
    {
      "name": "Suspect name",
      "description": "Suspect background and motive",
      "occupation": "Occupation"
    }
  ],
  "clues": [
    {
      "title": "Clue title",
      "description": "Clue details"
    }
  ],
  "hints": ["Helpful hint"],
  "culprit": "Exact name of culprit"
}
`;

  // MODEL NAME IS HERE
  const response = await genAI.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  const data = JSON.parse(rawText);

  if (
    !data.story ||
    !Array.isArray(data.suspects) ||
    !Array.isArray(data.clues) ||
    !Array.isArray(data.hints) ||
    !data.suspects.some(s => s.name === data.culprit)
  ) {
    throw new Error("Gemini generated invalid mystery data.");
  }

  if (
    data.suspects.length !== counts.suspects ||
    data.clues.length !== counts.clues ||
    data.hints.length !== counts.hints
  ) {
    throw new Error("Gemini generated incorrect numbers. Please try again.");
  }

  return data;
}

// CREATE CASE
router.post("/", async (req, res) => {
  try {
    const { title, premise, difficulty = "Easy" } = req.body;

    if (!title || !premise) {
      return res.status(400).json({
        success: false,
        message: "Title and premise are required"
      });
    }

    if (!baseScores[difficulty]) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty"
      });
    }

    const aiData = await generateMystery(premise, difficulty);

    const newCase = await Case.create({
      title,
      premise,
      difficulty,
      story: aiData.story,
      suspects: aiData.suspects,
      clues: aiData.clues.map(clue => ({
        ...clue,
        discovered: false
      })),
      culprit: aiData.culprit,
      hints: aiData.hints
    });

    res.status(201).json({
      success: true,
      message: "AI mystery generated successfully",
      case: {
        id: newCase._id,
        title: newCase.title,
        premise: newCase.premise,
        story: newCase.story,
        difficulty: newCase.difficulty,
        suspects: newCase.suspects,
        clues: newCase.clues
      }
    });

  } catch (error) {
    console.error("AI Case Generation Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate mystery"
    });
  }
});

// GET ALL CASES
router.get("/", async (req, res) => {
  try {
    const cases = await Case.find().select("-culprit -hints");
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE CASE
router.get("/:id", async (req, res) => {
  try {
    const mysteryCase = await Case.findById(req.params.id)
      .select("-culprit -hints");

    if (!mysteryCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    res.json({ success: true, case: mysteryCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DISCOVER A CLUE
router.post("/:id/clues/:clueId/discover", async (req, res) => {
  try {
    const mysteryCase = await Case.findById(req.params.id);

    if (!mysteryCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (mysteryCase.isCompleted) {
      return res.status(400).json({ success: false, message: "Case is already completed" });
    }

    const clue = mysteryCase.clues.id(req.params.clueId);

    if (!clue) {
      return res.status(404).json({ success: false, message: "Clue not found" });
    }

    if (!clue.discovered) {
      clue.discovered = true;
      mysteryCase.discoveredClues += 1;
      await mysteryCase.save();
    }

    res.json({
      success: true,
      message: "Clue discovered",
      clue,
      discoveredClues: mysteryCase.discoveredClues
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REQUEST A HINT
router.post("/:id/hints", async (req, res) => {
  try {
    const mysteryCase = await Case.findById(req.params.id)
      .select("+culprit +hints");

    if (!mysteryCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (mysteryCase.isCompleted) {
      return res.status(400).json({ success: false, message: "Case is already completed" });
    }

    if (mysteryCase.hintsUsed >= mysteryCase.hints.length) {
      return res.status(400).json({ success: false, message: "No hints remaining" });
    }

    const hint = mysteryCase.hints[mysteryCase.hintsUsed];
    mysteryCase.hintsUsed += 1;
    await mysteryCase.save();

    res.json({
      success: true,
      hint,
      hintsUsed: mysteryCase.hintsUsed,
      remainingHints: mysteryCase.hints.length - mysteryCase.hintsUsed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ACCUSE A SUSPECT
router.post("/:id/accuse", async (req, res) => {
  try {
    const { suspectName } = req.body;

    if (!suspectName) {
      return res.status(400).json({
        success: false,
        message: "Suspect name is required"
      });
    }

    const mysteryCase = await Case.findById(req.params.id)
      .select("+culprit +hints");

    if (!mysteryCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (mysteryCase.isCompleted) {
      return res.status(400).json({ success: false, message: "Case is already completed" });
    }

    const suspectExists = mysteryCase.suspects.some(
      suspect => suspect.name === suspectName
    );

    if (!suspectExists) {
      return res.status(400).json({ success: false, message: "Invalid suspect" });
    }

    const isCorrect = suspectName === mysteryCase.culprit;
    const baseScore = baseScores[mysteryCase.difficulty] || 100;

    const finalScore = isCorrect
      ? Math.max(
          0,
          baseScore +
          mysteryCase.discoveredClues * 5 -
          mysteryCase.hintsUsed * 10
        )
      : 0;

    mysteryCase.accusedSuspect = suspectName;
    mysteryCase.isCompleted = true;
    mysteryCase.score = finalScore;
    await mysteryCase.save();

    res.json({
      success: true,
      correct: isCorrect,
      score: finalScore,
      message: isCorrect
        ? "Correct! You solved the mystery."
        : "Incorrect accusation. Mystery failed."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET FINAL RESULT
router.get("/:id/result", async (req, res) => {
  try {
    const mysteryCase = await Case.findById(req.params.id)
      .select("+culprit");

    if (!mysteryCase) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (!mysteryCase.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Accuse a suspect to see the result"
      });
    }

    res.json({
      success: true,
      title: mysteryCase.title,
      accusedSuspect: mysteryCase.accusedSuspect,
      culprit: mysteryCase.culprit,
      correct: mysteryCase.accusedSuspect === mysteryCase.culprit,
      score: mysteryCase.score,
      difficulty: mysteryCase.difficulty,
      discoveredClues: mysteryCase.discoveredClues,
      hintsUsed: mysteryCase.hintsUsed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
