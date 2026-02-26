# 12POP.AI

> AI 本地生活执行助理 — Local Life AI Execution Assistant

## Overview

12POP.AI is an AI-powered local life execution assistant for Singapore's Chinese community, embedded in the 唐人街外卖 (Chinatown Delivery) App.

**Module A (V1)**: AI Execution Assistant — shopping, errands, home services via AI chat

## Project Structure

```
├── client/          # Taro 4 (React + TypeScript) — H5 + WeChat Mini Program
├── server/          # Node.js (Express + TypeScript) — API Backend
└── README.md
```

## Quick Start

### Server

```bash
cd server
npm install
npm run dev          # Start dev server on port 3001
```

### Client

```bash
cd client
npm install
npm run dev:h5       # Start H5 dev server
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Taro 4 + React + TypeScript + Sass |
| Backend | Node.js + Express 5 + TypeScript |
| Database | PostgreSQL (via Prisma) |
| AI | Claude API (Anthropic) |
| Execution | Immedi AI (mock in dev) |
| Payment | 唐人街外卖 existing system (stub in dev) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/conversation` | Create conversation |
| POST | `/api/conversation/:id/messages` | Send message (SSE) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task status |
| POST | `/api/quotes` | Generate quote |
| POST | `/api/webhooks/immedi` | Immedi webhook |
| GET | `/api/wallet/:userId` | Get wallet balance |

## Environment Variables

See `server/.env` for all configuration options.
