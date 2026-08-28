# 🤖 AI Resume Analyzer & Job Skill Matcher

An AI-powered career assistance platform that analyzes resumes, identifies skill gaps, matches candidates with job requirements, and provides personalized career guidance.

## 🚀 Overview

**AI Resume Analyzer & Job Skill Matcher** is a full-stack web application designed to help job seekers understand how well their resume matches a target job role.

The platform uses AI/NLP-based analysis to extract skills from resumes, evaluate candidate profiles, identify missing skills, and provide actionable recommendations for career improvement.

## ✨ Key Features

### 📄 AI Resume Analysis

* Upload and analyze resumes
* Extract technical and professional skills
* Generate resume analysis reports
* Identify strengths and weaknesses
* Provide improvement suggestions

### 🎯 Job Skill Matcher

* Compare candidate skills with job requirements
* Calculate skill-match scores
* Identify missing skills
* Recommend skills that should be learned
* Provide role-specific career insights

### 🤖 AI Career Advisor

* Personalized career recommendations
* Skill improvement suggestions
* Career-path guidance
* AI-powered recommendations based on candidate profile

### 🎤 AI Mock Interview

* AI-generated interview questions
* Practice technical and behavioral questions
* Interview preparation assistance
* Session-based interview experience

### 💬 AI Career Chatbot

* Ask career-related questions
* Get personalized AI responses
* Resume and skill-related guidance

### 📊 Skill Market Analysis

* Analyze skill demand
* Identify valuable skills
* Provide market-oriented skill recommendations

### 👤 User Authentication

* User registration and login
* Protected routes
* Profile management
* Account settings

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript / JSX
* Tailwind CSS
* CSS
* React Context API
* Chart-based data visualization

### Backend

* Node.js
* Express.js
* REST APIs
* JWT Authentication
* Middleware-based authorization

### Database

* MongoDB
* Mongoose

### AI / NLP

* Groq API
* Natural Language Processing
* Resume skill extraction
* AI-powered career analysis

## 🏗️ Project Structure

```text
AI-Resume-Analyzer/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── ai/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sudhu-8271/AI-Resume-Analyzer-and-Job-Skill-Macher.git
```

```bash
cd AI-Resume-Analyzer-and-Job-Skill-Macher
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

Start the backend:

```bash
npm start
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm start
```

The application will normally be available at:

```text
http://localhost:3000
```

## 🔐 Environment Variables

Never upload API keys, passwords, database credentials, or secrets to GitHub.

Required backend environment variables:

| Variable       | Description                    |
| -------------- | ------------------------------ |
| `PORT`         | Backend server port            |
| `MONGO_URI`    | MongoDB connection string      |
| `JWT_SECRET`   | Secret used for authentication |
| `GROQ_API_KEY` | Groq API key                   |

## 🔄 Application Workflow

```text
User
  ↓
Upload Resume
  ↓
Resume Processing
  ↓
Skill Extraction
  ↓
AI/NLP Analysis
  ↓
Skill & Resume Evaluation
  ↓
Job Requirement Matching
  ↓
Skill Gap Identification
  ↓
Personalized Recommendations
```

## 🎯 Example Use Case

A candidate uploads their resume and selects a target role such as:

```text
Software Developer
```

The system can analyze the resume and determine:

```text
Candidate Skills
       ↓
Required Job Skills
       ↓
Matching Skills
       ↓
Missing Skills
       ↓
Skill Gap
       ↓
Learning Recommendations
```

This helps candidates understand what they should improve before applying for a job.

## 🔒 Security

The application includes:

* JWT-based authentication
* Protected API routes
* Authentication middleware
* Environment variable protection
* Secure handling of user-specific data

## 📌 Future Improvements

* Job portal API integration
* Real-time job recommendations
* LinkedIn profile analysis
* Advanced resume scoring
* ATS compatibility analysis
* Personalized learning-roadmap generation
* Voice-based AI interview
* Multi-language resume analysis
* Cloud deployment

## 👨‍💻 Developer

**Sudhanshu Kumar**

B.Tech Computer Science & Engineering

## ⭐ Project Highlights

This project demonstrates practical experience with:

* Full-stack development
* React.js
* Node.js & Express.js
* MongoDB
* REST API development
* Authentication & authorization
* AI integration
* NLP-based skill extraction
* Resume analysis
* Job skill matching
* Data visualization
* AI-powered career assistance

---

⭐ If you find this project useful, consider giving the repository a star!
