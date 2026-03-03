# Twenty-One Degrees — Backend

Hono + TypeScript REST API and Socket.IO server for the Twenty-One Degrees project.

## Technologies

| Layer | Library |
|-------|---------|
| Runtime | [Bun](https://bun.sh) |
| REST framework | [Hono](https://hono.dev) |
| Real-time | [Socket.IO](https://socket.io) |
| Database | MySQL via [mysql2](https://github.com/sidorares/node-mysql2) |
| Cache | Redis via [ioredis](https://github.com/redis/ioredis) |
| Auth | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| Email | [Nodemailer](https://nodemailer.com) |

---

## Environment Variables

Create a `.env` file in `backend/`:

---

## Setup & Installation

```sh
bun install
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Compile TypeScript then start the server |
| `bun run build` | Compile TypeScript to `dist/` only |
| `bun run format` | Format all source files with Prettier |

---

## Running

```sh
bun run dev
```

- REST API → `http://localhost:3001`
- Socket.IO → `ws://localhost:3002`

---