
import { useState } from "react";
import "./App.css";

// Deployed Render Backend URL
const API_URL = "https://ai-mystery-room-wdqh.onrender.com/api/cases";

const Icon = ({ children }) => (
  <span className="icon">{children}</span>
);

export default function App() {
  const [page, setPage] = useState("home");
  const [difficulty, setDifficulty] = useState("Easy");
  const [caseData, setCaseData] = useState(null);
  const [discovered, setDiscovered] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [message, setMessage] = useState("");
  const [premise, setPremise] = useState("");
  const [accusation, setAccusation] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Common API request function
  const apiRequest = async (url, options = {}) => {
    let response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } catch {
      throw new Error(
        "Unable to connect to the server. Please try again."
      );
    }

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid server response. Please try again.");
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || `Server error: ${response.status}`
      );
    }

    return data;
  };

  // Start a new mystery
  const startGame = async () => {
    if (!premise.trim()) {
      setMessage("Please enter a mystery premise.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify({
          title: "The Mystery Investigation",
          premise: premise.trim(),
          difficulty,
        }),
      });

      if (!data.case?.id) {
        throw new Error("The server did not return a valid case ID.");
      }

      const newCase = await apiRequest(
        `${API_URL}/${data.case.id}`
      );

      setCaseData(newCase.case);
      setDiscovered([]);
      setHintsUsed(0);
      setAccusation(null);
      setResult(null);
      setMessage("");
      setPage("game");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Discover a clue
  const discoverClue = async (index) => {
    if (discovered.includes(index)) {
      setMessage("You have already discovered this clue.");
      return;
    }

    try {
      const clue = caseData.clues[index];

      const data = await apiRequest(
        `${API_URL}/${caseData._id}/clues/${clue._id}/discover`,
        { method: "POST" }
      );

      setDiscovered((previous) => [...previous, index]);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Request a hint
  const requestHint = async () => {
    try {
      const data = await apiRequest(
        `${API_URL}/${caseData._id}/hints`,
        { method: "POST" }
      );

      setHintsUsed(data.hintsUsed);
      setMessage(data.hint);
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Make an accusation
  const makeAccusation = async (suspectName) => {
    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest(
        `${API_URL}/${caseData._id}/accuse`,
        {
          method: "POST",
          body: JSON.stringify({ suspectName }),
        }
      );

      const finalResult = await apiRequest(
        `${API_URL}/${caseData._id}/result`
      );

      setAccusation(suspectName);

      setResult({
        ...finalResult,
        correct: data.correct,
        score: data.score,
      });

      setPage("result");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const base =
    difficulty === "Easy" ? 100 :
    difficulty === "Medium" ? 150 : 200;

  const correct = result?.correct || false;
  const score = result?.score || 0;

  return (
    <div className="app">

      <nav className="navbar">
        <div className="brand">
          <Icon>◎</Icon> MYSTERY<span>ROOM</span>
        </div>
        <div className="nav-label">
          DETECTIVE INTELLIGENCE SYSTEM
        </div>
      </nav>

      {page === "home" && (
        <section className="hero">
          <div className="eyebrow">◇ CASE FILES ARE WAITING</div>

          <h1>
            Every Mystery Has<br />
            <span>A Hidden Truth.</span>
          </h1>

          <p>
            Enter a world of secrets, investigate evidence, question
            suspects, and uncover the truth. Your detective journey
            starts here.
          </p>

          <button
            className="primary"
            onClick={() => {
              setMessage("");
              setPage("create");
            }}
          >
            ▶ Start Investigation
          </button>

          <div className="stats">
            <div>
              <strong>03</strong>
              <small>DIFFICULTIES</small>
            </div>
            <div>
              <strong>AI</strong>
              <small>MYSTERY ENGINE</small>
            </div>
            <div>
              <strong>∞</strong>
              <small>POSSIBILITIES</small>
            </div>
          </div>
        </section>
      )}

      {page === "create" && (
        <section className="panel">
          <button
            className="back"
            onClick={() => setPage("home")}
          >
            ← Back
          </button>

          <div className="eyebrow">NEW CASE</div>
          <h1>Create Your Mystery</h1>

          <p>
            Choose your investigation difficulty and enter a mystery premise.
          </p>

          <div className="difficulty">
            {["Easy", "Medium", "Hard"].map((level) => (
              <button
                key={level}
                className={
                  difficulty === level
                    ? "level selected"
                    : "level"
                }
                onClick={() => setDifficulty(level)}
              >
                {level}

                <small>
                  {level === "Easy"
                    ? "3 Suspects · 5 Clues · 2 Hints"
                    : level === "Medium"
                    ? "4 Suspects · 7 Clues · 3 Hints"
                    : "5 Suspects · 9 Clues · 3 Hints"}
                </small>
              </button>
            ))}
          </div>

          <label>MYSTERY PREMISE</label>

          <textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            placeholder="Example: A priceless painting disappears from a museum..."
          />

          {message && <div className="notice">{message}</div>}

          <button
            className="primary"
            onClick={startGame}
            disabled={loading}
          >
            {loading ? "Generating..." : "✦ Generate Mystery"}
          </button>

          <p className="small-note">
            Your mystery case will be saved in the database.
          </p>
        </section>
      )}

      {page === "game" && caseData && (
        <section className="panel wide">
          <button
            className="back"
            onClick={() => setPage("create")}
          >
            ← New Case
          </button>

          <div className="eyebrow">
            ACTIVE INVESTIGATION · {caseData.difficulty.toUpperCase()}
          </div>

          <h1>{caseData.title}</h1>
          <p>{caseData.story || caseData.premise}</p>

          <div className="progress">
            Evidence discovered: {discovered.length} / {caseData.clues.length}

            <div className="progress-track">
              <div
                style={{
                  width: `${
                    (discovered.length / caseData.clues.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          <h2>◈ Evidence Board</h2>

          <div className="clues">
            {caseData.clues.map((clue, index) => (
              <button
                key={clue._id}
                className={
                  discovered.includes(index)
                    ? "clue found"
                    : "clue"
                }
                onClick={() => discoverClue(index)}
              >
                <strong>
                  CLUE #{String(index + 1).padStart(2, "0")}
                </strong>

                <span>
                  {discovered.includes(index)
                    ? `${clue.title}: ${clue.description}`
                    : "Click to investigate this evidence"}
                </span>

                <small>
                  {discovered.includes(index)
                    ? "✓ DISCOVERED"
                    : "◉ UNDISCOVERED"}
                </small>
              </button>
            ))}
          </div>

          <h2>♙ Suspects</h2>

          <div className="suspects">
            {caseData.suspects.map((suspect, index) => (
              <div
                className="suspect"
                key={suspect._id || index}
              >
                <div className="suspect-avatar">♙</div>

                <div>
                  <strong>{suspect.name}</strong>
                  <small>{suspect.occupation}</small>
                  <p>{suspect.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button
              className="secondary"
              onClick={requestHint}
            >
              💡 Request Hint ({hintsUsed})
            </button>

            <button
              className="primary"
              onClick={() => {
                setMessage("");
                setPage("accuse");
              }}
            >
              Make Accusation →
            </button>
          </div>

          {message && <div className="notice">{message}</div>}
        </section>
      )}

      {page === "accuse" && caseData && (
        <section className="panel">
          <button
            className="back"
            onClick={() => setPage("game")}
          >
            ← Back to Evidence
          </button>

          <div className="eyebrow">FINAL DECISION</div>

          <h1>Who is the Culprit?</h1>

          <p>
            Study your evidence and select the person responsible.
          </p>

          {caseData.suspects.map((suspect) => (
            <button
              className="suspect-choice"
              key={suspect._id}
              disabled={loading}
              onClick={() => makeAccusation(suspect.name)}
            >
              ♙ {suspect.name} — {suspect.occupation}
            </button>
          ))}

          {loading && <p>Checking your accusation...</p>}

          {message && <div className="notice">{message}</div>}
        </section>
      )}

      {page === "result" && caseData && result && (
        <section className="panel result">
          <div className="eyebrow">CASE CLOSED</div>

          <div className="result-icon">
            {correct ? "🏆" : "✕"}
          </div>

          <h1>
            {correct ? "Mystery Solved!" : "Wrong Accusation"}
          </h1>

          <h2>{score} POINTS</h2>

          <p>Your accusation: {accusation}</p>

          <p>
            Actual culprit: <strong>{result.culprit}</strong>
          </p>

          <div className="solution">
            <strong>THE TRUTH</strong>

            <p>
              {correct
                ? "Congratulations! You successfully solved the mystery."
                : "Your accusation was incorrect. Study the evidence carefully next time."}
            </p>
          </div>

          <div className="score-breakdown">
            <div>
              <span>Base score</span>
              <strong>{base}</strong>
            </div>

            <div>
              <span>Clues discovered</span>
              <strong>+{result.discoveredClues * 5}</strong>
            </div>

            <div>
              <span>Hints used</span>
              <strong>-{result.hintsUsed * 10}</strong>
            </div>

            <div>
              <span>Final score</span>
              <strong>{score}</strong>
            </div>
          </div>

          <button
            className="primary"
            onClick={() => {
              setPremise("");
              setMessage("");
              setPage("create");
            }}
          >
            ▶ Play Again
          </button>

          <button
            className="secondary home-button"
            onClick={() => {
              setPremise("");
              setMessage("");
              setPage("home");
            }}
          >
            Return Home
          </button>
        </section>
      )}
    </div>
  );
}
