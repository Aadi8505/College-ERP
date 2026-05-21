# 16 — Crash Course: FastAPI, Neo4j, Celery, RabbitMQ, Redis, Docker, CI/CD

> You said you don't know these. This file teaches you each one conceptually with enough depth to survive interview questions. No fluff — only what you need to explain confidently.

---

## 🐍 1. FastAPI

### What Is It?

FastAPI is a **modern Python web framework** for building APIs. Think of it as "Express.js but in Python, with automatic validation and documentation."

### Why FastAPI Over Flask/Django?

| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| Speed | ⚡ Fastest (async, Starlette-based) | Medium | Slower |
| Auto docs | ✅ Swagger + ReDoc built-in | ❌ Manual | ❌ Manual |
| Validation | ✅ Automatic via Pydantic | ❌ Manual | ⚠️ Serializers |
| Async | ✅ Native `async/await` | ⚠️ Limited | ⚠️ Limited |
| Learning curve | Low | Lowest | High |
| Batteries | Minimal (like Express) | Minimal | Full (ORM, admin, auth) |

### How It Maps to Your Express Knowledge

```
Express                          FastAPI
───────                          ───────
const app = express()        →   app = FastAPI()
app.get("/users", handler)   →   @app.get("/users")
req.body                     →   Pydantic model (auto-validated)
res.json({ data })           →   return { "data": data }
middleware                   →   Dependencies (Depends())
router                       →   APIRouter
```

### Core Concept: Pydantic Models (Automatic Validation)

In Express, you manually validate:
```js
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return ApiResponse.badRequest("Invalid email").send(res);
}
```

In FastAPI, you define a schema and it validates automatically:
```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr          # Auto-validates email format
    name: str                # Required string
    age: int                 # Must be an integer
    phone: str = None        # Optional

@app.post("/users")
async def create_user(user: UserCreate):    # FastAPI validates before this runs
    return {"message": f"Created {user.name}"}
```

If someone sends `{ "email": "not-an-email", "age": "abc" }`, FastAPI automatically returns a 422 error with detailed validation messages. **You write zero validation code.**

### Core Concept: Dependency Injection (Replaces Middleware)

Your Express auth middleware:
```js
const auth = (req, res, next) => {
  const token = req.header("Authorization");
  req.userId = jwt.verify(token, secret).userId;
  next();
};
router.get("/profile", auth, getProfile);
```

FastAPI equivalent:
```python
from fastapi import Depends, Header

async def get_current_user(authorization: str = Header()):
    token = authorization.split(" ")[1]
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    return payload["userId"]

@app.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    # user_id is automatically extracted from the token
    return {"userId": user_id}
```

`Depends()` is like middleware but more explicit — you see exactly what each endpoint needs.

### Core Concept: Auto-Generated API Docs

After defining routes, visit:
- `http://localhost:8000/docs` → Swagger UI (interactive testing)
- `http://localhost:8000/redoc` → ReDoc (clean documentation)

**This is built-in. Zero configuration.** Your entire API is documented with request/response schemas, status codes, and a "Try It" button.

### How to Answer "Do You Know FastAPI?"

> "I haven't built a production project with FastAPI yet, but I understand the core concepts: it's a high-performance Python framework that uses Pydantic for automatic request validation, dependency injection instead of middleware, and generates Swagger docs automatically. I'm comfortable with async/await from my Express project, and the patterns map directly — routers, middleware, request handling. I'm eager to use it."

---

## 🔵 2. Redis

### What Is It?

Redis is an **in-memory key-value data store**. Think of it as a super-fast dictionary that lives in RAM instead of disk.

### Why It's Fast

| Storage | Read Speed | Data Lives In |
|---------|-----------|--------------|
| MongoDB | ~5-50ms | Disk (SSD) |
| PostgreSQL | ~5-50ms | Disk (SSD) |
| Redis | ~0.1-1ms | RAM (Memory) |

RAM is 100x faster than SSD. That's why Redis is used for data that must be accessed frequently and quickly.

### What Redis Is Used For

1. **Caching**: Store frequently-read data (user sessions, API responses)
   ```
   Client → Cache (Redis) → hit? Return cached → miss? Query DB → Store in Redis → Return
   ```

2. **Session storage**: Store user sessions (instead of JWT, some apps use session IDs stored in Redis)

3. **Rate limiting**: Track `user_ip: request_count` with auto-expiry
   ```
   Key: "login:192.168.1.1"  Value: 5  Expiry: 15 minutes
   ```

4. **Message broker**: Celery uses Redis as a task queue (alternative to RabbitMQ)

5. **Real-time features**: Pub/Sub for chat, notifications, live updates

### Redis Data Types

```
Strings:   SET name "Aadi"          GET name          → "Aadi"
Lists:     LPUSH queue "task1"      RPOP queue        → "task1"
Sets:      SADD tags "python"       SMEMBERS tags     → {"python"}
Hashes:    HSET user:1 name "Aadi"  HGET user:1 name  → "Aadi"
Sorted Sets: ZADD leaderboard 100 "player1"
```

### How It Relates to Your Project

Your College ERP could use Redis for:
- **Cache branch list** (rarely changes): `SET branches "[...]" EX 300` (expires in 5 min)
- **Rate limit login**: Track failed attempts per IP, block after 5 failures
- **Session store**: Replace localStorage JWT with server-side sessions in Redis
- **Celery broker**: Send "password reset email" tasks to Redis for background processing

### How to Answer "Do You Know Redis?"

> "Redis is an in-memory key-value store. I understand it's used for caching (to avoid repeated database queries), session management, rate limiting, and as a message broker for Celery. I know the basic data types — strings, lists, hashes, sets — and the concept of TTL (time-to-live) for auto-expiring keys. In my project, I'd use it to cache branch/subject lists and rate-limit the login endpoint."

---

## 🐰 3. RabbitMQ

### What Is It?

RabbitMQ is a **message broker** — a middleman that receives messages from producers and delivers them to consumers.

### The Core Problem It Solves

In your College ERP, when a user resets their password:
```
Current:  API request → Send email (2-3 seconds) → Return response
                         ↑ User waits for this

Better:   API request → Push "send email" to queue → Return response (instant)
                         ↓
                    Worker picks up task → Sends email (2-3 seconds)
                    (User doesn't wait)
```

### How It Works (Conceptual)

```
Producer                  RabbitMQ                  Consumer
────────                  ────────                  ────────
"Send reset email         ┌──────────────────┐      Worker process
 to user@gmail.com"  ──►  │ Queue: emails    │  ──► Picks up message
                          │ ┌──────────────┐ │      Calls Nodemailer
                          │ │ message 1    │ │      Sends the email
                          │ │ message 2    │ │
                          │ │ message 3    │ │
                          │ └──────────────┘ │
                          └──────────────────┘
```

### Key Concepts

| Concept | What It Is |
|---------|-----------|
| **Producer** | The code that sends messages (your API controller) |
| **Queue** | A buffer that stores messages until processed |
| **Consumer** | A worker process that reads and processes messages |
| **Exchange** | Routes messages to the correct queue (like a post office) |
| **Acknowledgment** | Consumer confirms message processed → broker deletes it |

### RabbitMQ vs Redis as Message Broker

| Aspect | RabbitMQ | Redis |
|--------|----------|-------|
| Purpose | Dedicated message broker | Multi-purpose (cache + broker) |
| Reliability | ✅ Messages persist on disk | ⚠️ Messages lost if Redis crashes |
| Routing | ✅ Complex routing (exchanges, topics) | ⚠️ Simple pub/sub |
| Performance | Fast (thousands/sec) | Faster (millions/sec) |
| When to use | Mission-critical tasks | Simple task queues, caching |

### How to Answer "Do You Know RabbitMQ?"

> "RabbitMQ is a message broker that decouples task producers from consumers. Instead of processing long-running tasks synchronously (like sending emails), you push a message to a queue. A separate worker process picks it up and processes it in the background. This improves API response times and adds fault tolerance — if the worker crashes, messages stay in the queue. I know it's commonly used with Celery in Python projects."

---

## 🌿 4. Celery

### What Is It?

Celery is a **Python distributed task queue**. It lets you run functions in the background, outside the request-response cycle.

### The Architecture

```
Your FastAPI App                Broker                    Workers
───────────────                (Redis/RabbitMQ)           ───────
                               ┌──────────────┐
@app.post("/reset")            │              │         Celery Worker 1
  send_email.delay(email) ──►  │  Task Queue  │  ──►   def send_email(email):
  return {"msg": "sent!"}      │              │           transporter.send(email)
                               │              │
                               └──────────────┘         Celery Worker 2
                                                        (same, for scaling)
```

### How It Works

1. **Define a task** (a regular Python function with a decorator):
```python
from celery import Celery

celery_app = Celery("tasks", broker="redis://localhost:6379")

@celery_app.task
def send_reset_email(email, reset_link):
    # This runs in a SEPARATE process, not in your API
    send_mail(email, reset_link)
    return f"Email sent to {email}"
```

2. **Call it from your API** (non-blocking):
```python
@app.post("/forgot-password")
async def forgot_password(email: str):
    reset_link = generate_reset_link(email)
    send_reset_email.delay(email, reset_link)  # .delay() = async dispatch
    return {"message": "If this email exists, a reset link was sent"}
    # Response returns IMMEDIATELY, email sends in background
```

3. **Start the worker** (separate terminal):
```bash
celery -A tasks worker --loglevel=info
```

### Key Concepts

| Concept | Meaning |
|---------|---------|
| `.delay()` | Send task to the broker (non-blocking) |
| `.apply_async()` | Same as delay but with options (countdown, eta, retries) |
| **Broker** | Message transport (Redis or RabbitMQ) |
| **Backend** | Where results are stored (Redis, PostgreSQL) |
| **Worker** | Separate process that executes tasks |
| **Beat** | Scheduler for periodic tasks (like cron) |

### What Would Use Celery in Your Project?

1. **Sending password reset emails** — Currently blocks the API for 2-3 seconds
2. **Generating reports** — "Export all student marks as PDF" (CPU-intensive)
3. **Bulk notifications** — "Notify all students about a new notice"
4. **Data cleanup** — "Delete expired reset tokens every hour" (Celery Beat)

### How to Answer "Do You Know Celery?"

> "Celery is a Python distributed task queue. You define tasks as functions, dispatch them to a broker (Redis or RabbitMQ) using `.delay()`, and separate worker processes execute them. The API responds immediately without waiting for the task to finish. In my project, I'd use Celery for email sending (currently blocking), report generation, and periodic cleanup tasks via Celery Beat."

---

## 🕸️ 5. Neo4j

### What Is It?

Neo4j is a **graph database** — it stores data as **nodes** and **relationships** instead of tables or documents.

### When Graphs Beat Tables

| Query | SQL/MongoDB | Neo4j |
|-------|------------|-------|
| "Find user's friends" | Easy (1 JOIN) | Easy |
| "Find friends of friends" | Hard (2 JOINs) | Easy |
| "Find 6 degrees of separation" | Extremely hard (6 JOINs) | Still easy |
| "Shortest path between two users" | Custom algorithm needed | Built-in |

**Rule of thumb**: If your data is about **connections and relationships**, Neo4j is better. If it's about **records and attributes**, SQL/MongoDB is better.

### Core Concepts

```
     ┌──────────┐    TEACHES     ┌──────────┐
     │ Faculty   │──────────────►│ Subject   │
     │ name:"Dr."│               │ name:"CS" │
     └──────────┘               └──────────┘
          │                          ▲
     BELONGS_TO                 ENROLLED_IN
          │                          │
          ▼                     ┌──────────┐
     ┌──────────┐              │ Student   │
     │ Branch   │              │ name:"A"  │
     │ name:"IT"│              └──────────┘
     └──────────┘
```

- **Node**: An entity (Student, Faculty, Subject) — like a document or row
- **Relationship**: A connection between nodes (TEACHES, ENROLLED_IN) — has a type and direction
- **Property**: Key-value data on nodes or relationships (name, date, weight)
- **Label**: Category for a node (Student, Faculty) — like a collection or table

### Query Language: Cypher

```cypher
// Find all subjects taught by Dr. Smith
MATCH (f:Faculty {name: "Dr. Smith"})-[:TEACHES]->(s:Subject)
RETURN s.name

// Find students in same branch as a faculty member
MATCH (f:Faculty)-[:BELONGS_TO]->(b:Branch)<-[:BELONGS_TO]-(s:Student)
WHERE f.name = "Dr. Smith"
RETURN s.name

// Shortest path between two students (through shared subjects/branches)
MATCH path = shortestPath(
  (a:Student {name: "Alice"})-[*]-(b:Student {name: "Bob"})
)
RETURN path
```

### How It Relates to Gocomet

Gocomet is in **logistics**. Graph databases excel at:
- **Route optimization**: Cities as nodes, roads as relationships with distance/time properties
- **Supply chain**: Warehouses → shipping routes → destinations
- **Tracking**: Package → moved to → location → shipped via → carrier

### How to Answer "Do You Know Neo4j?"

> "Neo4j is a graph database that stores data as nodes and relationships. It's ideal for highly connected data — like logistics routes, social networks, or org hierarchies — where SQL JOINs become slow. The query language is Cypher, which uses pattern matching like `(a)-[:KNOWS]->(b)`. In a college ERP context, it could model faculty-subject-student relationships more naturally than tables. I haven't built with it yet, but I understand the data model and when to choose it over relational databases."

---

## 🐳 6. Docker

### What Is It?

Docker **packages your application + all its dependencies into a portable container** that runs the same everywhere.

### The Problem Docker Solves

```
Without Docker:
  Developer: "It works on my machine!"
  Server:    "Node.js 14, not 18. MongoDB 4, not 7. Missing npm packages."

With Docker:
  Same image runs on laptop, staging, and production. Always the same.
```

### Core Concepts

| Concept | What It Is | Analogy |
|---------|-----------|---------|
| **Image** | A blueprint for a container | A class in OOP |
| **Container** | A running instance of an image | An object (instance) |
| **Dockerfile** | Instructions to build an image | A recipe |
| **Docker Compose** | Run multiple containers together | Running frontend + backend + DB |
| **Registry** | Image storage (Docker Hub) | npm registry for packages |

### What a Dockerfile Looks Like (For Your Backend)

```dockerfile
# 1. Start from Node.js base image
FROM node:18-alpine

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy the rest of the code
COPY . .

# 5. Expose the port your app runs on
EXPOSE 4000

# 6. Start the application
CMD ["node", "index.js"]
```

### Docker Compose (Run Everything Together)

```yaml
# docker-compose.yml
version: "3"
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/college_db
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

`docker-compose up` starts **everything** — frontend, backend, and MongoDB — with one command.

### How to Answer "Do You Know Docker?"

> "Docker containers package an application with its exact dependencies so it runs the same everywhere. A Dockerfile defines the image — base OS, install dependencies, copy code, define the start command. Docker Compose orchestrates multiple containers — in my project, I'd have separate containers for the Express backend, React frontend, and MongoDB. I haven't dockerized my project yet, but I understand the workflow: write Dockerfile → build image → run container."

---

## 🔄 7. CI/CD

### What Is It?

- **CI (Continuous Integration)**: Automatically test and build code on every push
- **CD (Continuous Deployment)**: Automatically deploy passing builds to production

### The Pipeline

```
Developer pushes code
        │
        ▼
┌─────────────────┐
│  1. Lint code    │  ← Check code style
│  2. Run tests    │  ← Unit + integration tests
│  3. Build        │  ← `npm run build`
│  4. Security scan│  ← Check for vulnerabilities
└────────┬────────┘
         │ All pass?
    ┌────┼────┐
    │ Yes     │ No
    ▼         ▼
Deploy     Alert developer
to prod    (build fails)
```

### GitHub Actions Example (For Your Project)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install
      - run: cd backend && npm test         # Run tests
      - run: cd frontend && npm install
      - run: cd frontend && npm run build   # Verify build works

  deploy:
    needs: test                             # Only deploy if tests pass
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'     # Only on main branch
    steps:
      - run: curl -X POST $RENDER_DEPLOY_HOOK  # Trigger Render deploy
```

### Key CI/CD Concepts

| Concept | What It Means |
|---------|-------------|
| **Pipeline** | A sequence of automated steps (test → build → deploy) |
| **Trigger** | What starts the pipeline (push, PR, schedule) |
| **Artifact** | Build output that gets deployed (the frontend `build/` folder) |
| **Environment** | Where code runs (staging, production) |
| **Rollback** | Reverting to the previous version if deployment fails |

### How to Answer "Do You Know CI/CD?"

> "CI/CD automates the path from code push to deployment. CI runs linters, tests, and builds on every push — catching bugs before merge. CD automatically deploys passing builds to production. I'd set it up with GitHub Actions: on push to main → install dependencies → run tests → build frontend → deploy to Render/Vercel. This eliminates manual deployment and ensures broken code never reaches production."

---

## 📝 Quick Reference: How All These Fit Together

```
User Request
    │
    ▼
┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│   React      │────►│   FastAPI     │────►│  PostgreSQL    │
│  (Frontend)  │     │   (Backend)   │     │  (Primary DB)  │
└──────────────┘     └───────┬───────┘     └────────────────┘
                             │
                    ┌────────┼────────┐
                    │                 │
                    ▼                 ▼
              ┌──────────┐    ┌────────────┐
              │  Redis   │    │   Neo4j    │
              │ (Cache + │    │ (Graph DB) │
              │  Broker) │    │ Routes,    │
              └────┬─────┘    │ networks)  │
                   │          └────────────┘
                   ▼
             ┌──────────┐
             │  Celery  │
             │ (Workers)│
             │ Emails,  │
             │ Reports  │
             └──────────┘

All wrapped in Docker containers, deployed via CI/CD pipeline
```

---

## 🎯 Interview-Ready One-Liners

Use these when asked "do you know X?":

| Tech | One-Liner |
|------|-----------|
| **FastAPI** | "Python web framework with auto-validation via Pydantic, async support, and built-in Swagger docs" |
| **Redis** | "In-memory key-value store used for caching, sessions, rate limiting, and as a Celery message broker" |
| **RabbitMQ** | "Message broker that decouples producers from consumers, enabling reliable async task processing" |
| **Celery** | "Python distributed task queue — dispatch background jobs via `.delay()`, workers process them independently" |
| **Neo4j** | "Graph database storing nodes and relationships — ideal for route optimization, networks, and connected data" |
| **Docker** | "Containerization — packages app + dependencies into a portable image that runs the same everywhere" |
| **CI/CD** | "Automated pipeline: push code → run tests → build → deploy. Catches bugs early, eliminates manual deploys" |
