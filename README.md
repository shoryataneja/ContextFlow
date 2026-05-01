# ContextFlow

A Context & Memory Management System for AI agents in business environments.

Stores, retrieves, and ranks contextual information (immediate, historical, temporal, experiential) for decision-making using a weighted scoring algorithm.

---

## Architecture

```
score = (0.5 × recencyScore) + (0.3 × frequencyScore) + (0.2 × similarityScore)
```

- **recencyScore** — exponential time decay (`e^(-0.1 × ageInDays)`)
- **frequencyScore** — log-normalised access count
- **similarityScore** — keyword match (fallback) or OpenAI embeddings (optional)

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional)
- OpenAI API key (optional)

---

## Setup

### 1. Clone & install

```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/contextflow"
PORT=5000
NODE_ENV=development

# Optional Redis caching
USE_REDIS=false
REDIS_URL="redis://localhost:6379"

# Optional OpenAI semantic similarity
USE_OPENAI=false
OPENAI_API_KEY="sk-..."

# Memory lifecycle
STALE_THRESHOLD_DAYS=7
TOP_N_CONTEXTS=10

CORS_ORIGIN="http://localhost:5173"
```

### 3. Create database & run migrations

```bash
# Create the database first
createdb contextflow

# Run migrations
cd backend
npx prisma migrate dev --name init
```

### 4. Start servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/context` | Create context |
| `GET` | `/api/context` | List all contexts |
| `GET` | `/api/context/retrieve` | Retrieve top-N ranked contexts |
| `GET` | `/api/context/explain/:id` | Score explanation |
| `GET` | `/api/context/stats` | Type distribution stats |
| `GET` | `/api/context/:id` | Get single context |
| `PUT` | `/api/context/:id` | Update context |
| `DELETE` | `/api/context/:id` | Soft delete (mark stale) |

### Retrieve query params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | `""` | Text for similarity scoring |
| `limit` | number | `10` | Max results |
| `type` | enum | `""` | Filter by context type |
| `includeStale` | boolean | `false` | Include stale contexts |

### Example: Create context

```bash
curl -X POST http://localhost:5000/api/context \
  -H "Content-Type: application/json" \
  -d '{
    "type": "IMMEDIATE",
    "content": "Customer reported billing issue with subscription plan",
    "metadata": { "source": "support-ticket", "priority": "high" },
    "relevanceScore": 0.8
  }'
```

### Example: Retrieve top contexts

```bash
curl "http://localhost:5000/api/context/retrieve?query=billing+issue&limit=5"
```

---

## Features

- **Memory lifecycle** — contexts older than `STALE_THRESHOLD_DAYS` are automatically marked stale during retrieval
- **Conflict resolution** — when scores are tied (< 0.001 diff), most recent context wins
- **Redis caching** — context list cached for 30s (optional, graceful fallback)
- **OpenAI embeddings** — cosine similarity via `text-embedding-3-small` (optional, falls back to keyword match)
- **Rate limiting** — 200 req / 15 min per IP

---

## Project Structure

```
ContextFlow/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config/          # prisma, redis, logger
│       ├── controllers/     # request/response handling
│       ├── middleware/       # error handler, rate limiter
│       ├── repositories/    # DB access layer
│       ├── routes/          # Express routes
│       ├── services/        # business logic
│       ├── utils/           # scoring, validators, AppError
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── components/      # Navbar, ContextCard, ScoreBreakdown, UI
        ├── hooks/           # useContexts, useRetrieve
        ├── pages/           # Dashboard, ContextList, ContextDetail, AddContext, Retrieve
        ├── services/        # Axios API client
        ├── utils/           # helpers (colors, timeAgo)
        ├── App.jsx
        └── main.jsx
```
