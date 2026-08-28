# 🤖 AI Resume Analyzer & Job Skill Matcher

An AI-powered full-stack application that analyzes resumes, extracts skills, identifies skill gaps, and matches candidates with job requirements.

## 🚀 Features

*  **AI Resume Analysis** — Upload resume and get AI-powered analysis, strengths, weaknesses, and suggestions.
*  **Job Skill Matcher** — Compare resume skills with job requirements and identify missing skills.
*  **AI Career Advisor** — Get personalized career and skill improvement recommendations.
*  **AI Mock Interview** — Generate and practice AI-powered interview questions.
*  **AI Career Chatbot** — Get personalized career and resume guidance.
*  **Skill Market Analysis** — Analyze skill demand and discover valuable skills.
*  **Authentication** — Secure login, signup, protected routes, and profile management.

## 🛠️ Tech Stack

**Frontend**

* React.js
* JavaScript / JSX
* Tailwind CSS
* Context API

**Backend**

* Node.js
* Express.js
* REST API
* JWT Authentication

**Database**

* MongoDB
* Mongoose

**AI / NLP**

* Groq API
* NLP-based Skill Extraction
* AI Resume Analysis
* AI Career Recommendations

## 🏗️ Project Structure

```text
AI-Resume-Analyzer/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       └── pages/
│
├── backend/
│   ├── ai/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
│
├── .gitignore
└── README.md
```

## ⚙️ Setup

### Clone Repository

```bash
git clone https://github.com/Sudhu-8271/AI-Resume-Analyzer-and-Job-Skill-Macher.git
cd AI-Resume-Analyzer-and-Job-Skill-Macher
```

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

Run backend:

```bash
npm start
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Application:

```text
http://localhost:3000
```

## 🔄 How It Works

```text
Resume Upload
      ↓
Resume Processing
      ↓
Skill Extraction
      ↓
AI Analysis
      ↓
Job Skill Matching
      ↓
Skill Gap Detection
      ↓
Personalized Recommendations
```

## 🔐 Security

* JWT-based authentication
* Protected API routes
* Environment variables for sensitive credentials
* `.env` files excluded from Git
