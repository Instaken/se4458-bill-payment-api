# SE 4458 - AI Agent Bill Payment Chat Application

> AI-powered chat application for bill payment using Google Gemini AI, Google Cloud Firestore, and Google Cloud API Gateway.

**Live App**: [Your Gateway URL after deployment]

---

## 🚀 Quick Start (5 Minutes)

### 1. Get API Keys

- **Gemini API**: https://aistudio.google.com/app/apikey
- **Firebase**: https://console.firebase.google.com (create project, enable Firestore, download Service Account JSON)

### 2. Configure Environment

1. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
   NODE_ENV=development
   ```

2. Save your Firebase service account key as `firebase-service-account.json` in the root directory.

### 3. Add Test Data to Firestore

In Firestore Console, create a document at this path:
`subscribers/123456/bills/2024-11`

With these fields:
- `month` (string): "2024-11"
- `amount` (number): 150
- `paidAmount` (number): 0
- `status` (string): "UNPAID"
- `details` (map): `{ dataUsage: "10 GB", callMinutes: 200, smsCount: 50 }`

### 4. Run Application (Locally)

The project includes a helper script to start both the backend and frontend servers:

```bash
# This script handles dependency installation and starts both servers
./dev.sh
```

- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:3000
- **Swagger Docs**: http://localhost:8080/api-docs

---

## ☁️ Deployment to Google Cloud

The project includes a comprehensive deployment script `deploy.sh` that automates the deployment to Cloud Run and updates the API Gateway.

### Prerequisites
- Google Cloud CLI installed and authenticated (`gcloud auth login`, `gcloud config set project PROJECT_ID`)
- Gemini API Key stored in Google Cloud Secret Manager (the script will prompt if missing)

### One-Click Deployment

```bash
./deploy.sh
```

**What this script does:**
1. specific checks for required secrets.
2. Updates `api-gateway-config.yaml` with the latest backend URL.
3. Deploys the Backend (Node.js/Express) to **Cloud Run**.
4. Creates a new API Gateway configuration.
5. Updates the **API Gateway** to point to the new deployment.

### Architecture Notes
- The **Frontend** is built and served statically by the Backend in production (`NODE_ENV=production`), so you only need to deploy the backend service.
- The **Gateway** manages authentication and routing.

---

## 📁 Project Structure

```
├── src/                    # Backend Source Code
│   ├── app.js             # Express App Setup
│   ├── controllers/       # Route Logic (Chat, Bills, Admin)
│   ├── routes/            # API Route Definitions
│   ├── middleware/        # Auth & Logging Middleware
│   └── config/            # Firebase & App Config
├── frontend/              # Frontend Source Code
│   ├── src/               # React Components
│   └── vite.config.js     # Vite Configuration
├── api-gateway-config.yaml # Google Cloud API Gateway Spec
├── deploy.sh              # Automated Deployment Script
├── dev.sh                 # Local Development Script
├── index.js               # Application Entry Point
└── package.json           # Backend Dependencies
```

---

## 🏗️ Architecture

```
User → React Frontend (served via API Gateway) → API Gateway → Express Backend → Gemini AI
                                                                             → Firestore DB
```

**Key Features:**
- **AI Chat**: Natural language processing with Gemini 2.0 Flash for understanding user intent.
- **API Gateway**: Centralized entry point handling path routing and security.
- **Firestore**: Real-time NoSQL database for subscriber and bill data.
- **Cloud Run**: Serverless container hosting for the application logic.

---

## 🎯 Features

- ✅ **Natural Language Interface**: Ask "How much is my bill?" or "Pay my bill".
- ✅ **AI Intent Recognition**: Automatically detects if user wants to Query, Pay, or see Details.
- ✅ **Secure Payments**: Transactional updates to Firestore.
- ✅ **Detailed Breakdown**: View data usage, call minutes, and SMS details.
- ✅ **Modern Dashboard**: Responsive React-based UI with dark mode support.
- ✅ **Swagger Documentation**: Interactive API testing ui.

---

## 📝 API Endpoints

### Chat (Main)
```http
POST /chat
{
  "message": "Pay my bill for subscriber 123456",
  "history": []
}
```

### Bills Management
- `POST /api/v1/bills/query`: Get bill status
- `POST /api/v1/bills/pay`: Process payment (Atomic transaction)

### Documentation
Access the full Swagger documentation at `/api-docs` when running locally.

---

## 🧪 Testing Scenarios

1. **Query Bill**: "What is the bill for subscriber 123456?"
2. **Details**: "Show me the details for this month."
3. **Payment**: "Id like to pay 50 TL."
4. **Context Maintenance**: The AI maintains context, so you can ask follow-up questions like "is it paid yet?"

---

## 👥 Team

**Group 1 - Mobile Provider Bill Payment System**

- ÜLKÜ BARTU SERBEST
- AYSİMA ADATEPE
- ELİF EMİNE GÜNAL
- IRMAK ARABACI
- DİLARA ACAR
- AHMET KEMAL BİLİCİLER
- YAĞMUR SABIRLI
- OZAN BÖCE
- MURAT HABİP OKAN
- MELİKE AYTAÇ
- MELİSA DEMİRBAŞ
- PELİN DUMAN
- SELÇUK SUAT SAYIN
- DEFNE TEKYİĞİT
- LARA ÖZDUMAN
- DURU GENCAY

---

## 📚 Tech Stack

- **Frontend**: React 18, Vite, Lucide React
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini 2.0 Flash (`@google/generative-ai`)
- **Database**: Google Cloud Firestore (`firebase-admin`)
- **Infrastructure**: Google Cloud Run, API Gateway, Secret Manager

---

## 📄 License

Educational project for SE 4458 course.