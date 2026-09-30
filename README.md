# AI-Powered Intelligent Government Scheme Assistance Platform

A full-stack, AI-powered engineering platform designed to assist Indian citizens in discovering, understanding, and assessing government welfare schemes based on personal circumstances.

Initial domains covered:
1. 🌾 **Farmers & Agriculture Schemes**
2. 🎓 **Education & Student Schemes**
3. 👩 **Women & Child Welfare Schemes**

The platform is designed with an extensible architecture allowing future additions (healthcare, housing, employment, senior citizens, skill development) without changing core systems.

---

## 🏗️ System Architecture

```
React Frontend (Vite + React Router + Axios)
       │
       ▼ (REST APIs + JWT Auth)
Django Backend (Django REST Framework)
  ├── apps/users (User & UserProfile models, JWT Authentication)
  ├── apps/schemes (GovernmentScheme & SavedScheme models)
  ├── apps/eligibility (EligibilityRule model & Deterministic Rule Engine)
  ├── apps/documents (RequiredDocument model & Guidance)
  ├── apps/chatbot (AI Chatbot REST endpoints)
  └── apps/recommendations (Personalized Scheme REST endpoints)
       │
       ├── ai/ (Modular AI Layer: Chatbot, Embeddings, Recommendations, Explanations)
       └── scripts/ (Excel/CSV Importer & seed_demo_data management command)
       │
       ▼
PostgreSQL Database
```

---

## 🛠️ Technology Stack

* **Frontend**: React.js, HTML5, CSS3 (Custom Design System), JavaScript (ES6+), Vite, React Router DOM, Axios, Lucide React Icons.
* **Backend**: Python 3.10+, Django 5.x, Django REST Framework, Django CORS Headers, SimpleJWT.
* **Database**: PostgreSQL (with standard SQLite fallback support for instant zero-config testing).
* **AI & NLP Integration Points**: Interfaced for Gemini API (`GEMINI_API_KEY`), Sentence Transformers, and vector similarity search.

---

## 🚀 Step-by-Step Local Setup Guide

### 1. Prerequisites
Ensure you have installed:
* Python 3.10 or higher
* Node.js v18+ and npm
* PostgreSQL (Optional for local testing; SQLite fallback is enabled by default in `.env`)

---

### 2. Backend Setup (Django)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables:
   Copy `.env.example` to `.env` (already created during foundation setup):
   ```bash
   cp .env.example .env
   ```

   **Environment Variables configured in `.env`:**
   ```env
   DEBUG=True
   SECRET_KEY=django-insecure-scheme-assistance-platform-dev-key-2026
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Database Configuration
   USE_POSTGRES=False
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=gov_scheme_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432

   # AI Integration
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

### 3. Configuring PostgreSQL Database

If you wish to use PostgreSQL:
1. Open PostgreSQL prompt / pgAdmin:
   ```sql
   CREATE DATABASE gov_scheme_db;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE gov_scheme_db TO postgres;
   ```
2. Update `backend/.env`:
   ```env
   USE_POSTGRES=True
   DB_NAME=gov_scheme_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   ```

---

### 4. Running Migrations & Seeding Demo Data

1. Run Django migrations to create all database tables:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. Seed initial verified government scheme demo data (Agriculture, Education, Women & Child Welfare):
   ```bash
   python manage.py seed_demo_data
   ```
   > 📌 **Note:** All seeded schemes are clearly flagged with `is_demo_data = True` to distinguish sample data from future production government datasets.

3. Create a Superuser for Django Admin:
   ```bash
   python manage.py createsuperuser
   ```

4. Start Django Development Server:
   ```bash
   python manage.py runserver
   ```
   Backend will run at `http://127.0.0.1:8000/`.

---

### 5. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will run at `http://localhost:5173/`.

---

## 🔗 Database Models Connection Overview

```
User (Django Auth)
  └── 1:1 ──► UserProfile (Personal attributes: Age, State, Occupation, Income, Category, Farmer/Student status)

GovernmentScheme (Scheme ID, Category, Ministry, Benefits, Official Links)
  ├── 1:N ──► EligibilityRule (Attribute, Operator [=, !=, >, <, >=, <=, IN], Value, Description)
  ├── 1:N ──► RequiredDocument (Document Name, Mandatory/Optional, Description)
  └── 1:N ──► SavedScheme (User FK, Scheme FK, Bookmark Timestamp)
```

---

## 🧠 Future AI Services Integration Points

All AI modules reside cleanly inside `backend/ai/`:

1. **`ai/chatbot_service.py` (`ChatbotService`)**:
   Communicates with the Google Gemini API using `GEMINI_API_KEY`. It passes user queries alongside strictly retrieved database scheme context to prevent hallucinations.
2. **`ai/embedding_service.py` (`EmbeddingService`)**:
   Provides vector embeddings via Sentence Transformers / pgvector for semantic natural language query matching (e.g. *"I am a small farmer from Maharashtra looking for crop loss help"*).
3. **`ai/recommendation_service.py` (`RecommendationService`)**:
   Combines rule evaluation scores with user profile metadata for hybrid scheme ranking.
4. **`ai/explanation_service.py` (`ExplanationService`)**:
   Translates deterministic rule evaluation outputs into plain language citizen reports.

---

## 📊 Excel/CSV Scheme Dataset Import Utility

To import custom verified government datasets collected in Excel or CSV format:

1. Place your dataset `.csv` or `.xlsx` file in `backend/scripts/sample_data/`.
2. Run the import utility script:
   ```bash
   python scripts/import_dataset.py --file scripts/sample_data/government_schemes.xlsx
   ```
3. The script validates all columns, inserts/updates `GovernmentScheme`, creates structured `EligibilityRule` records from rule strings (e.g., `age>=18|gender=FEMALE`), and attaches `RequiredDocument` items automatically.

---

## 🛡️ Security & Constraints

1. **Deterministic Rule Engine**: Eligibility logic is computed deterministically in `apps/eligibility/engine.py`. LLMs are never permitted to independently decide legal eligibility.
2. **Official Source Redirects**: The platform provides application guidance and directs users to verified government portals (`https://pmkisan.gov.in/`, `https://scholarships.gov.in/`, `https://pmfby.gov.in/`, etc.).
3. **API Keys**: No API keys are exposed to the frontend; all external AI calls go through the Django service layer.
