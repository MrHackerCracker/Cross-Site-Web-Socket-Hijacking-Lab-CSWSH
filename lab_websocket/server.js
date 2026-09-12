const express = require("express");
const WebSocket = require("ws");
const https = require("https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const app = express();
const fs = require("fs");
const server = https.createServer({
    cert: fs.readFileSync("./cert/cert.pem"),
    key: fs.readFileSync("./cert/key.pem")
}, app);
const wss = new WebSocket.Server({ noServer: true });
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
// In-memory users/messages for a simple lab.
const users = new Map();       // username -> { username, passwordHash }
const sessions = new Map();    // token -> username
const sockets = new Map();     // username -> Set<WebSocket>
const messages = [];

app.use(express.json());
app.use(express.static("public"));

/*
 * INTENTIONAL LAB VULNERABILITY #1:
 * Authentication API accepts credentialed cross-origin requests from ANY origin.
 *
 * A real application should use an explicit allowlist and should not combine
 * Access-Control-Allow-Origin: * with credentials.
 */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function makeToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });
}

function setSessionCookie(res, token) {
  /*
   * INTENTIONAL LAB VULNERABILITY #2:
   * SameSite=None permits the browser to attach this authentication cookie
   * to cross-site requests. Secure is disabled so the lab works on localhost.
   */
   
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,          // localhost is treated as a secure context by modern browsers
    maxAge: 10 * 60 * 60 * 1000, // 10 hours
    path: "/"
  });
}

// Minimal cookie parser; no extra dependency needed.
function getCookie(req, name) {
  const raw = req.headers.cookie || "";
  const item = raw.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function usernameFromRequest(req) {
  const token = getCookie(req, "session");
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.username;
  } catch {
    return null;
  }
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || username.length < 2 || password.length < 4) {
    return res.status(400).json({ error: "Username/password requirements not met" });
  }
  if (users.has(username)) {
    return res.status(409).json({ error: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.set(username, { username, passwordHash });
  res.json({ ok: true, message: "Registered successfully" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = users.get(username);

  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = makeToken(username);
  sessions.set(token, username);
  setSessionCookie(res, token);

  res.json({ ok: true, username });
});

app.post("/api/logout", (req, res) => {
  const token = getCookie(req, "session");
  if (token) sessions.delete(token);
  res.clearCookie("session", { path: "/" });
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  const username = usernameFromRequest(req);
  if (!username) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, username });
});

app.get("/api/users", (req, res) => {
  const username = usernameFromRequest(req);
  if (!username) return res.status(401).json({ error: "Not authenticated" });
  res.json([...users.keys()].filter(u => u !== username));
});

app.get("/api/messages", (req, res) => {
  const username = usernameFromRequest(req);
  if (!username) return res.status(401).json({ error: "Not authenticated" });
  res.json(messages.slice(-100));
});

/*
 * INTENTIONAL LAB VULNERABILITY #3:
 * WebSocket upgrade accepts the connection without validating the Origin.
 *
 * In a real deployment, validate Origin against a strict allowlist before
 * accepting an authenticated WebSocket connection.
 */
server.on("upgrade", (req, socket, head) => {
  if (!req.url.startsWith("/ws")) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit("connection", ws, req);
  });
});

function wsUsername(req) {
  const token = getCookie(req, "session");
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.username;
  } catch {
    return null;
  }
}

function sendJSON(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function broadcast(data) {
  for (const set of sockets.values()) {
    for (const ws of set) sendJSON(ws, data);
  }
}

wss.on("connection", (ws, req) => {
  const username = wsUsername(req);

  if (!username) {
    sendJSON(ws, { type: "error", message: "Not authenticated" });
    return ws.close();
  }

  if (!sockets.has(username)) sockets.set(username, new Set());
  sockets.get(username).add(ws);

  sendJSON(ws, {
    type: "system",
    message: `Connected as ${username}`
  });

  ws.on("message", raw => {
    let body;
    try {
      body = JSON.parse(raw.toString());
    } catch {
      return sendJSON(ws, { type: "error", message: "Invalid JSON" });
    }

    if (body.type !== "chat" || typeof body.to !== "string" || typeof body.message !== "string") {
      return sendJSON(ws, { type: "error", message: "Invalid chat message" });
    }

    const msg = {
      id: crypto.randomUUID(),
      from: username,
      to: body.to,
      message: body.message.slice(0, 1000),
      timestamp: new Date().toISOString()
    };

    messages.push(msg);

    // Deliver to sender and recipient if connected.
    for (const recipient of [msg.from, msg.to]) {
      const set = sockets.get(recipient);
      if (set) {
        for (const client of set) sendJSON(client, { type: "chat", ...msg });
      }
    }
  });

  ws.on("close", () => {
    const set = sockets.get(username);
    if (set) {
      set.delete(ws);
      if (!set.size) sockets.delete(username);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Live chat lab running at http://chatapp.local:${PORT}`);
  console.log("Intentional vulnerabilities: permissive credentialed CORS, SameSite=None cookie, no WebSocket Origin validation.");
});
