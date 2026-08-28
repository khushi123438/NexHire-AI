# 🚀 NexHire AI

### AI-Powered Interview Coach 

NexHire AI is an AI-powered interview platform that simulates a real recruiter-driven interview experience. It analyzes a candidate's resume and skills, conducts personalized HR and technical interviews, asks dynamic follow-up questions, evaluates answers, maintains complete interview history, and provides an AI-based hiring recommendation.

---

## ✨ Features

### 🔐 Authentication
- User Signup and Login
- JWT-based authentication
- Google OAuth authentication
- Secure user sessions

### 📄 Resume Analysis
- Upload candidate resume
- Extract relevant skills from the resume
- Use extracted skills to personalize interviews
- Manage uploaded resumes

### 🤖 AI-Powered Interviews
- Personalized HR and technical interviews
- Dynamic question generation
- Context-aware follow-up questions
- Interview questions based on candidate skills and resume
- AI recruiter-style interaction

### 🎙️ Voice-Based Interview
- Voice-based communication between candidate and AI recruiter
- Speech converted into text
- Candidate responses stored with interview data
- Audio-based interview experience

### 🧠 AI Answer Evaluation
- Analyze candidate answers
- Evaluate answer quality and relevance
- Generate feedback
- AI-based candidate assessment

### 📚 Conversation & Interview History
Every interview session is stored with its complete conversation history.

Example:

```json
{
  "interviewId": "INT12345",
  "speaker": "AI_RECRUITER",
  "text": "Tell me about yourself.",
  "audioUrl": "uploads/audio/ai-question-1.mp3",
  "timestamp": "2026-07-19T10:02:00Z",
  "duration": 12
}

{
  "interviewId": "INT12345",
  "speaker": "CANDIDATE",
  "text": "My name is Khushi Pandey...",
  "audioUrl": "uploads/audio/candidate-answer-1.webm",
  "timestamp": "2026-07-19T10:03:00Z",
  "duration": 28
}
```

### ⏱️ Interview Session Management
- Start interview
- Pause interview
- End interview
- Question timer
- Skip question
- Mark question for review

---

## 🔄 How NexHire AI Works
```
Candidate
    │
    ▼
Authentication
    │
    ▼
Resume Upload
    │
    ▼
Resume Skill Extraction
    │
    ▼
Interview Configuration
    │
    ▼
AI Recruiter
    │
    ├── HR Questions
    ├── Technical Questions
    └── Dynamic Follow-up Questions
    │
    ▼
Candidate Answers
    │
    ▼
AI Answer Evaluation
    │
    ▼
Interview History
    │
    ▼
Final Hiring Recommendation
```

---

## 🏗️ System Architecture
```
                    ┌─────────────────────┐
                    │      Candidate      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │    + Tailwind CSS   │
                    └──────────┬──────────┘
                               │
                         REST APIs
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Node.js + Express.js│
                    │      Backend        │
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────┘      └─────────────┐
              ▼                                 ▼
      ┌───────────────┐                 ┌───────────────┐
      │    MongoDB    │                 │   AI Services │
      │   Database    │                 │ Gemini / APIs │
      └───────────────┘                 └───────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Javascript
- Vite

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB

### Authentication
- JWT
- Google OAuth
  
### AI
- Gemini API
- AI-based question generation
- AI-based answer evaluation
- AI-powered hiring recommendation

### Voice & Speech
- Speech-to-Text
- Text-to-Speech
- Voice-based interview processing

---

📁 Project Structure

```
NexHire-AI/
│
├── Backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```
- **Note**: .env contains private credentials and is intentionally excluded from GitHub.

## ⚙️ Installation & Setup

### 1. Clone the repository
```
git clone https://github.com/khushi123438/NexHire-AI.git
cd NexHire-AI
```

### 2. Setup Backend
```
cd Backend
```
- Install dependencies:
```
npm install
```
- Create a .env file inside the Backend folder:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GEMINI_API_KEY=your_gemini_api_key
```
- Start backend:
```
npm run dev
```

### 3. Setup Frontend

- Open another terminal:
```
cd Frontend
```
- Install dependencies:
```
npm install
```
- Start frontend:
```
npm run dev
```
- The frontend will normally run on:
```
http://localhost:5173
```

### 🔑 Environment Variables

The project uses environment variables for sensitive configuration such as:

MongoDB connection
JWT secret
Google OAuth credentials
Gemini API key
Frontend/backend URLs

- Never commit your actual .env file or API keys to GitHub.

---

## 🔒 Security

NexHire AI follows basic security practices including:

- JWT authentication
- Environment-based secret management
- Password protection
- OAuth authentication
- .env excluded from version control
- Protected API routes

---

## 🎯 Use Cases

NexHire AI can be useful for:

- Students preparing for placements
- Job seekers practicing interviews
- HR interview preparation
- Technical interview preparation
- Resume-based interview practice
- AI-powered candidate assessment
- Recruiter-style interview simulations

---

## 👩‍💻 Developer
Khushi Pandey

B.Tech – Computer Science & Engineering
Artificial Intelligence Specialization

---

## Interested in:

- Artificial Intelligence
- Machine Learning
- Full Stack Development
- Generative AI
- Data Structures & Algorithms

---

## ⭐ Support

If you find NexHire AI useful, consider giving the repository a ⭐ on GitHub!

---

## 📜 License

This project is developed for educational, learning, and portfolio purposes.
