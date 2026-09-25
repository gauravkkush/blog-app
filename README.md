# Blog App

A full-stack blog application built with React on the frontend and Express + MySQL on the backend. Users can register, sign in, create and edit posts, upload image media, like content, comment on posts, and manage a personal trash area for deleted articles.

## Overview

This project is split into two main parts:

- `client/`: React frontend with routing, protected pages, and blog UI
- `api/`: Express API with authentication, database access, post management, and media handling

## Tech Stack

- Frontend: React, React Router, SCSS
- Backend: Node.js, Express
- Database: MySQL
- Auth: JWT + cookies
- File uploads: Multer
- Rich content: React Quill
- Other: CORS, dotenv, sanitize-html

## Features

- User registration and login
- Protected routes for authenticated users
- Post creation, editing, and deletion
- Draft and published post states
- Category and search filtering on public posts
- Image upload support for posts
- Likes and comments on posts
- Notification feed for user activity
- Trash view for soft-deleted posts
- Responsive blog layout

## Project Structure

```text
blog-app/
├── api/
│   ├── controllers/
│   ├── routes/
│   ├── db.js
│   ├── index.js
│   ├── package.json
│   ├── schema.sql
│   └── .env (local, not committed)
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── build/
├── .nvmrc
├── package-lock.json
└── README.md
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 20+
- npm
- MySQL database

## Database Setup

1. Create a MySQL database for the app.
2. Import the schema file:

```bash
mysql -u your_user -p your_database < api/schema.sql
```

The schema automatically creates the required tables for users, posts, comments, likes, notifications, and post media.

## Environment Configuration

Create a `.env` file inside the `api` folder:

```env
PORT=8800
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_super_secret_key_here

# Option 1: use a full DATABASE_URL
DATABASE_URL=mysql://username:password@host:3306/database_name
DB_SSL=false

# Optional alternative config if you prefer explicit values
# MYSQL_HOST=localhost
# MYSQL_USER=root
# MYSQL_PASSWORD=your_password
# MYSQL_DATABASE=blogapp
# MYSQL_PORT=3306
```

Notes:

- The backend accepts either `DATABASE_URL` or individual `MYSQL_*` variables.
- If your database requires TLS, set `DB_SSL=true`.
- `FRONTEND_URL` should match the frontend origin used by the React app.

## Installation

From the project root:

```bash
cd api && npm install
cd ../client && npm install
```

## Running the App

Start the backend API in one terminal:

```bash
cd api
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm start
```

The app will generally be available at:

- Frontend: http://localhost:3000
- API: http://localhost:8800

## Default API Behavior

The frontend is configured with this proxy setting:

```json
"proxy": "http://localhost:8800/api/"
```

That means the client can make requests such as `/api/posts` without manually specifying the backend host during development.

## Core API Endpoints

### Authentication

- `POST /api/auth/register` - register a new user
- `POST /api/auth/login` - log in a user
- `GET /api/auth/logout` - log out the current user

### Posts

- `GET /api/posts` - fetch published posts
- `GET /api/posts/:id` - fetch a single post
- `POST /api/posts` - create a post
- `PUT /api/posts/:id` - update a post
- `DELETE /api/posts/:id` - move a post to trash
- `GET /api/posts/trash` - view trashed posts
- `PUT /api/posts/trash/:id/restore` - restore a trashed post
- `DELETE /api/posts/trash/:id` - permanently delete a post

### Engagement

- `GET /api/posts/:id/comments` - fetch comments
- `POST /api/posts/:id/comments` - add a comment
- `DELETE /api/posts/:id/comments/:commentId` - delete a comment
- `POST /api/posts/:id/like` - toggle a like
- `GET /api/posts/:id/engagement` - fetch like and engagement data

### Media

- `GET /api/posts/media/:mediaId` - fetch post media by ID

## Common Development Notes

- The API uses cookie-based JWT authentication.
- Uploaded post media is stored in MySQL as binary data.
- The app uses a MySQL schema initializer on startup via `api/db.js`.
- The frontend and backend are designed to run together in development mode, with the client proxying API requests to the backend.

## License

This project is for learning and local development. Add a license file if you plan to distribute or reuse it publicly.
