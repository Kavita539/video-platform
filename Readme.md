# VaultCast — Video Upload, Sensitivity Processing & Streaming Platform

A full-stack application that enables users to upload videos, processes them for content sensitivity analysis, and provides seamless video streaming with real-time progress tracking.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Real-Time Events](#real-time-events)
- [Role-Based Access Control](#role-based-access-control)
- [Video Processing Pipeline](#video-processing-pipeline)
- [User Manual](#user-manual)
- [Deployment](#deployment)
- [Assumptions & Design Decisions](#assumptions--design-decisions)

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://video-platform-cyan-eight.vercel.app |
| **Backend API** | https://video-platform-production-2402.up.railway.app/api |
| **Health Check** | https://video-platform-production-2402.up.railway.app/api/health |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│              (Vite · Socket.io client · Axios)          │
└────────────────────────┬────────────────────────────────┘
                         │  HTTPS + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                  Express REST API                       │
│       /api/auth    /api/videos    /api/health           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │   JWT    │  │  Multer  │  │  Socket.io (WS/poll)  │ │
│  │  Auth    │  │  Upload  │  │  Progress broadcasts  │ │
│  └──────────┘  └──────────┘  └───────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Video Processing Service               │   │
│  │  FFprobe → Thumbnail → Sensitivity Analysis     │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │        MongoDB Atlas        │
          │  users · videos collections │
          └─────────────────────────────┘
```

### Data Flow: Upload → Stream

```
User picks file (Upload page)
        │
        ▼
POST /api/videos/upload  →  Video saved to disk, record created (pending)
        │                   Responds 201 immediately
        ▼
processVideo() fires async in background
        │
        ├─ [10%] FFprobe — extracts metadata
        ├─ [30%] Generate thumbnail
        ├─ [60%] Sensitivity analysis
        └─ [100%] Status → completed, sensitivityStatus → safe | flagged
        │
        ▼ (each stage)
emitProgress() → Socket.io → user:room → frontend ProgressBar updates live

User clicks Watch
        │
        ▼
GET /api/videos/:id/stream  →  HTTP Range request  →  206 Partial Content
        │
        ▼
<video> element plays seamlessly
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime |
| Express.js | REST API framework |
| MongoDB + Mongoose | Database + ODM |
| Socket.io | Real-time progress events |
| JWT (jsonwebtoken) | Authentication |
| Multer | File upload handling |
| fluent-ffmpeg + @ffmpeg-installer | Video processing |
| @ffprobe-installer/ffprobe | Video metadata extraction |
| bcryptjs | Password hashing |
| Helmet + CORS | Security |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool |
| React Router v7 | Client-side routing |
| Axios | HTTP client |
| Socket.io-client | Real-time updates |
| Tailwind CSS | Styling |
| Context API | State management |

### Infrastructure
| Service | Purpose |
|---|---|
| Railway | Backend hosting |
| Vercel | Frontend hosting |
| MongoDB Atlas | Cloud database |

---

## Project Structure

```
video-platform/
│
├── backend/
│   ├── src/
│   │   ├── server.js                  # Entry point
│   │   ├── config/
│   │   │   ├── database.js            # MongoDB connection
│   │   │   ├── multer.js              # Upload config
│   │   │   └── socket.js             # Socket.io setup
│   │   ├── models/
│   │   │   ├── User.js               # User schema (roles, org)
│   │   │   └── Video.js              # Video schema (status, sensitivity)
│   │   ├── controllers/
│   │   │   ├── authController.js     # Auth business logic
│   │   │   └── videoController.js    # Video CRUD + streaming
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT + RBAC middleware
│   │   │   ├── errorHandler.js       # Global error handling
│   │   │   └── validate.js           # Request validation
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── videoRoutes.js
│   │   │   └── healthRoutes.js
│   │   └── services/
│   │       └── videoProcessor.js     # FFmpeg pipeline
│   ├── tests/
│   │   └── backend.test.js
│   ├── .env.example
│   ├── railway.json
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx                   # Router + auth guards
    │   ├── services/
    │   │   ├── api.js                # Axios + all API calls
    │   │   └── socket.js             # Socket.io singleton
    │   ├── context/
    │   │   ├── AuthContext.jsx       # Global auth state
    │   │   └── ProcessingContext.jsx # Real-time job tracker
    │   ├── components/
    │   │   ├── layout/Layout.jsx     # Sidebar navigation
    │   │   └── ui/                   # Reusable components
    │   └── pages/
    │       ├── Auth.jsx              # Login + Register
    │       ├── Dashboard.jsx         # Stats + live jobs
    │       ├── Upload.jsx            # Drag-drop upload
    │       ├── Library.jsx           # Video grid + filters
    │       ├── VideoDetail.jsx       # Player + metadata
    │       └── Users.jsx             # Admin user management
    ├── .env.example
    ├── vercel.json
    └── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Kavita539/video-platform.git
cd video-platform
```

### 2. Backend setup

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:3000`

### 3. Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

App starts on `http://localhost:5173`

### 4. Run tests

```bash
cd backend
npm test
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `MAX_FILE_SIZE_MB` | No | `500` | Max upload size in MB |
| `UPLOAD_DIR` | No | `src/uploads` | Local upload directory |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Backend API base URL |
| `VITE_MAX_UPLOAD_MB` | No | Max upload size shown in UI |

---

## API Documentation

All protected routes require: `Authorization: Bearer <token>`

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Server + DB status |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/users` | ✅ Admin | List org users |
| PATCH | `/api/auth/users/:id/role` | ✅ Admin | Change user role |
| PATCH | `/api/auth/users/:id/status` | ✅ Admin | Toggle active/inactive |

#### Register
```json
// POST /api/auth/register
// Request
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securepass123",
  "organisation": "acme"
}

// Response 201
{
  "success": true,
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Alice", "role": "editor" }
}
```

#### Login
```json
// POST /api/auth/login
// Request
{ "email": "alice@example.com", "password": "securepass123" }

// Response 200
{ "success": true, "token": "<jwt>", "user": { ... } }
```

### Videos

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/videos/upload` | ✅ | Editor, Admin | Upload video |
| GET | `/api/videos` | ✅ | Any | List videos |
| GET | `/api/videos/stats` | ✅ | Admin | Org statistics |
| GET | `/api/videos/:id` | ✅ | Any | Get single video |
| GET | `/api/videos/:id/stream` | ✅ | Any | Stream video |
| GET | `/api/videos/:id/thumbnail` | ✅ | Any | Get thumbnail |
| PATCH | `/api/videos/:id` | ✅ | Editor, Admin | Update metadata |
| DELETE | `/api/videos/:id` | ✅ | Editor, Admin | Soft delete |

#### Upload
```
POST /api/videos/upload
Content-Type: multipart/form-data

Fields:
  video        (file)    — required
  title        (string)  — optional
  description  (string)  — optional
  tags         (string)  — optional, comma-separated
```

#### List Videos — Query Parameters
| Param | Values | Description |
|---|---|---|
| `status` | `pending` `processing` `completed` `failed` | Filter by status |
| `sensitivity` | `safe` `flagged` `unanalysed` | Filter by sensitivity |
| `search` | string | Title search |
| `page` | number | Page number (default 1) |
| `limit` | number | Per page (default 20, max 100) |

#### Stream
Supports HTTP `Range` header for seekable playback.
```
GET /api/videos/:id/stream?token=<jwt>
Range: bytes=0-1048576

→ 206 Partial Content
Content-Range: bytes 0-1048576/5242880
```

---

## Real-Time Events

### Client connection
```js
import { io } from 'socket.io-client';
const socket = io(BACKEND_URL);
socket.emit('join:user', userId); // join personal room
```

### `video:progress` — emitted by server
```json
{
  "videoId": "64abc...",
  "stage": "Analysing content sensitivity",
  "progress": 60,
  "status": "processing",
  "sensitivityStatus": "safe"  // present on final event
}
```

| Progress | Stage |
|---|---|
| 10% | Probing video metadata |
| 30% | Generating thumbnail |
| 60% | Analysing content sensitivity |
| 100% | Complete |

---

## Role-Based Access Control

| Action | Viewer | Editor | Admin |
|---|:---:|:---:|:---:|
| View own videos | ✅ | ✅ | ✅ |
| View all org videos | ❌ | ❌ | ✅ |
| Upload video | ❌ | ✅ | ✅ |
| Edit own video | ❌ | ✅ | ✅ |
| Delete own video | ❌ | ✅ | ✅ |
| Delete any video | ❌ | ❌ | ✅ |
| View org stats | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Video Processing Pipeline

```
1. Upload Validation
   └─ MIME type check (mp4, webm, mov, avi, mkv, mpeg)
   └─ File size check (max 500MB)
   └─ Unique filename generated with crypto.randomUUID()

2. Storage
   └─ Saved to src/uploads/<userId>/<uuid>.<ext>
   └─ MongoDB record created (processingStatus: pending)

3. FFprobe — metadata extraction
   └─ duration, width, height, codec, fps, bitrate

4. Thumbnail generation
   └─ Frame captured at 1 second
   └─ Saved as 320px wide JPEG

5. Sensitivity Analysis
   └─ Automated content screening
   └─ Returns: safe | flagged + confidence score
   └─ (Stub: replace analyseSensitivity() in videoProcessor.js
       with Google Video Intelligence / AWS Rekognition)

6. Streaming Preparation
   └─ HTTP Range request support (206 Partial Content)
   └─ Seekable playback via <video> element
```

---

## User Manual

### Registration & Login
1. Visit the app URL
2. Click **Register** to create a new account
3. Fill in name, email, password and organisation name
4. You will be logged in automatically and redirected to the Dashboard

### Uploading a Video
1. Click **Upload** in the sidebar (Editor/Admin only)
2. Drag and drop a video file or click to browse
3. Optionally add a title, description and tags
4. Click **Upload & Process**
5. Watch the real-time processing stages update live
6. Once complete, you will see the sensitivity classification (Safe/Flagged)

### Viewing Your Library
1. Click **Library** in the sidebar
2. Use the search bar to find videos by title
3. Filter by processing status or sensitivity classification
4. Click any video card to open it

### Playing a Video
1. Open a video from the Library
2. The video player appears once processing is complete
3. The sensitivity banner shows whether content is Safe or Flagged
4. Use the Edit button to update title, description or tags

### Admin — Managing Users
1. Admins see a **Users** link in the sidebar
2. View all users in your organisation
3. Change roles using the dropdown (Viewer / Editor / Admin)
4. Activate or deactivate accounts using the toggle button

---

## Deployment

### Backend — Railway
1. Push code to GitHub
2. Create new project on [railway.app](https://railway.app)
3. Deploy from GitHub repo, set **Root Directory** to `backend`
4. Add environment variables in the Variables tab
5. Click **Generate Domain** under Settings → Networking

### Frontend — Vercel
1. Import GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add `VITE_API_URL` environment variable pointing to Railway URL
4. Deploy — Vercel handles the rest automatically

### Important post-deploy steps
- Set `FRONTEND_URL` in Railway to your Vercel domain (for CORS)
- Set MongoDB Atlas Network Access to allow `0.0.0.0/0`
- Redeploy backend after updating `FRONTEND_URL`

---

## Assumptions & Design Decisions

| Decision | Rationale |
|---|---|
| **Fire-and-forget processing** | Upload endpoint responds with `201` immediately while processing runs async. Prevents HTTP timeouts on large files and keeps UX responsive. |
| **Socket.io user rooms** | Each user joins `user:<id>` on connect. Progress events are scoped to the uploading user only — no leaking to other users. |
| **Soft deletes** | Videos are marked `isDeleted: true` rather than permanently removed. Preserves audit trail. Files on disk are retained. |
| **Sensitivity analysis is simulated** | A real ML model (Google Video Intelligence, AWS Rekognition) would be a paid external dependency. The stub is clearly marked in `videoProcessor.js` and designed to be replaced in one function. |
| **Organisation-based multi-tenancy** | Simple string field scoping. All queries filter by `organisation`. Admins see all org data; editors/viewers see only their own. |
| **JWT query param for streaming** | The browser `<video>` element cannot set `Authorization` headers on its src request. Token is accepted via `?token=` query param for the stream endpoint only. |
| **crypto.randomUUID() for filenames** | Node built-in, no external dependency. Generates collision-proof unique filenames for uploaded files. |
| **Local file storage** | Suitable for development and Railway with persistent disk. For production at scale, swap Multer `diskStorage` for `multer-s3`. |
| **ffmpeg bundled via installer packages** | `@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe` bundle the binaries — no system FFmpeg required. Works on Railway/Render out of the box. |
| **No refresh tokens** | JWT-only auth keeps implementation simple for this project scope. Refresh token rotation can be added to `authController.js` if needed. |