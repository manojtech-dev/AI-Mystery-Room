# 🕵️ AI Mystery Room

### An AI-Powered Interactive Mystery Solving Game

AI Mystery Room is an interactive mystery-solving game where players investigate mysterious cases, analyze clues, identify suspects, and solve crimes using their logical thinking.

The application uses AI to generate engaging mystery scenarios and provides an interactive gaming experience.

## ✨ Features

- 🧩 **AI Mystery Generation** – Generate unique mystery cases using Gemini AI.
- 🔍 **Interactive Investigation** – Explore mystery scenarios and analyze clues.
- 🕵️ **Suspect Investigation** – Examine suspects and identify possible culprits.
- ⚖️ **Make Your Accusation** – Choose who you think is responsible.
- 🎮 **Play Again** – Start another mystery and enjoy a new challenge.
- 💻 **User-Friendly Interface** – Simple and interactive gaming experience.

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas

**AI Integration**
- Google Gemini API

## 📁 Project Structure

```text
AI-Mystery-Room/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── models/
│   │   └── case.js
│   ├── routes/
│   │   └── caseRoutes.js
│   ├── db.js
│   ├── server.js
│   └── package.json
│
└── .gitignore
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/manojtech-dev/AI-Mystery-Room.git
```

### 2. Setup Backend

```bash
cd AI-Mystery-Room/server
npm install
```

Create a `.env` file inside the server folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
node server.js
```

### 3. Setup Frontend

Open another terminal:

```bash
cd AI-Mystery-Room/client
npm install
npm run dev
```

Open the local URL displayed in the terminal to play the game.

## 🔐 Environment Variables

The application requires:
- `MONGODB_URI` – MongoDB Atlas connection string.
- `GEMINI_API_KEY` – Google Gemini API key.
- `PORT` – Backend server port.

**Note:** Never upload your `.env` file or expose your API keys publicly.

## 🎯 Project Goal

The goal of AI Mystery Room is to combine Artificial Intelligence with interactive gaming to create an engaging mystery-solving experience that improves logical thinking, investigation skills, and decision-making.

## 👨‍💻 Developer

**Manoj M**

GitHub: [@manojtech-dev](https://github.com/manojtech-dev)

---

⭐ If you like this project, consider giving it a star!
