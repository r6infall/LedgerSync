# LedgerSync 🚀
**AI-Powered GST Reconciliation & Compliance Platform**

LedgerSync is an intelligent B2B platform designed to automate GST reconciliation, eliminating the manual friction between buyers and sellers in India. By leveraging deterministic algorithms alongside Google's Gemini 1.5 Flash AI, LedgerSync analyzes invoices, flags anomalies, matches records flexibly, and translates complex tax mismatches into plain-English actionable insights.

*A streamlined, modern experience built for speed and precision.*

---

## ✨ Key Features

### 🔄 Deterministic + AI Reconciliation Engine
- **Multi-pass Matching:** Employs Exact and Fuzzy Levenshtein distance algorithms to securely and deterministically map Buyer Purchase Records against Supplier GSTR-2A uploads.
- **AI-Powered Insights:** Uses Gemini to explain root causes for mismatches (e.g., amount discrepancies, missing rows) so accounting teams know exactly how to fix them.
- **Automated Categorization:** Invoices are instantly tagged as `Matched`, `Mismatch`, `Missing`, or `Extra`.

### 👥 Dual Buyer & Seller Portals
- **Buyer Dashboard:** Upload purchase registers (CSV/Excel), track matching status, view AI risk signals, and estimate blocked ITC (Input Tax Credit).
- **Seller Dashboard:** Submit GSTR-1 payload mocks, track buyer approval status, and receive real-time change requests.

### 🤖 AI Anomaly Detection & Intelligence
- **Fraud/Risk Analysis:** Evaluates historical vendor behaviors, late filings, and structural inconsistencies using AI to generate trust scores.
- **Natural Language Querying:** An intuitive AI Insights interface that allows users to ask unstructured questions regarding their tax pipeline and get smart, context-aware answers.
- **Smart Recommendations:** Gives step-by-step resolution suggestions to avoid ITC blockage penalties.

### 🛡 Enterprise Grade Architecture
- **Firebase Authentication:** Secure, robust JWT-based login infrastructure.
- **Real-time Notifications:** In-app alerts for invoice flaggings, change requests, and approval events between buyers and sellers.
- **Data Deduplication:** Intelligent ledger cleanup scripts combined with robust Mongoose abstractions.

---

## 🛠 Tech Stack

**Frontend:**
- React 18, React Router DOM, Vite
- Vanilla CSS Modules (Glassmorphism, Responsive Modern Design)
- Lucide React (Icons), Recharts (Analytics)
- Firebase Auth

**Backend:**
- Node.js, Express.js
- MongoDB & Mongoose
- Google Gemini API (`@google/genai`)
- Razorpay API
- Multer & `csv-parse` for fast, in-memory ledger processing.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or on MongoDB Atlas
- Firebase Project (for Auth credentials)
- Google Gemini API Key

### 2. Environment Variables
Create a `.env` file in the `server` directory using your own credentials:
```env
PORT=5000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/ledgersync"
GEMINI_API_KEY="AIzaSyYourGeminiKeyHere"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
REDIS_URL="your-redis-url"
```

### 3. Installation

**Install Server Dependencies:**
```bash
cd server
npm install
```

**Install Client Dependencies:**
```bash
cd client
npm install
```

### 4. Running the Application

In terminal 1 (Backend):
```bash
cd server
npm run dev
```

In terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Visit the app at `http://localhost:3000`

### 5. Seeding Sample Data (Optional)
To test the deterministic reconciliation engine with pre-structured missing/matched cases:
```bash
cd server
node seed_sample.js
```
*Note: Ensure you update the GSTIN variables inside `seed_sample.js` to match the Buyer and Seller users you have created in your local DB.*

---

## 📁 Project Structure

```text
LedgerSync/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI Elements & Layouts
│   │   ├── pages/              # Portal Views (Buyer, Seller, General)
│   │   ├── services/           # Axios API Client & Error Interceptors
│   │   └── App.jsx             # Routing & Auth Verification Guards
│   └── public/
├── server/                     # Express Backend
│   ├── models/                 # Mongoose Schemas (Invoice, User, etc.)
│   ├── routes/                 # Express REST Endpoints
│   ├── services/               # Core Logic (Reconciliation Alg, Gemini Interfacing)
│   ├── middleware/             # Auth Token Checks
│   └── index.js                # App Entry Point
└── README.md
```

## 📜 License
This project is proprietary and confidential.
