let ws = null;
let currentUser = null;

const $ = id => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function register() {
  try {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: $("regUser").value,
        password: $("regPass").value
      })
    });
    $("authStatus").textContent = data.message;
  } catch (e) {
    $("authStatus").textContent = e.message;
  }
}

async function login() {
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("loginUser").value,
        password: $("loginPass").value
      })
    });

    currentUser = data.username;
    $("me").textContent = currentUser;
    $("auth").classList.add("hidden");
    $("chat").classList.remove("hidden");

    connectWS();
    loadUsers();
    loadMessages();
  } catch (e) {
    $("authStatus").textContent = e.message;
  }
}

async function logout() {
  if (ws) ws.close();
  await api("/api/logout", { method: "POST" }).catch(() => {});
  location.reload();
}

async function loadUsers() {
  try {
    const users = await api("/api/users");
    $("users").innerHTML = users.map(u =>
      `<button class="user" onclick="selectUser('${escapeHTML(u)}')">${escapeHTML(u)}</button>`
    ).join("");
  } catch (e) {
    console.error(e);
  }
}

async function loadMessages() {
  try {
    const msgs = await api("/api/messages");
    $("messages").innerHTML = "";
    msgs.forEach(addMessage);
  } catch (e) {
    console.error(e);
  }
}

function connectWS() {
  ws = new WebSocket(`wss://${location.host}/ws`);

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.type === "chat") addMessage(data);
    if (data.type === "error") console.error(data.message);
  };

  ws.onclose = () => console.log("WebSocket closed");
}

function sendMessage() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return alert("WebSocket is not connected");

  const to = $("to").value.trim();
  const message = $("message").value.trim();

  if (!to || !message) return;

  ws.send(JSON.stringify({ type: "chat", to, message }));
  $("message").value = "";
}

function selectUser(username) {
  $("to").value = username;
  $("message").focus();
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "msg";
  div.textContent = `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.from} → ${msg.to}: ${msg.message}`;
  $("messages").appendChild(div);
  $("messages").scrollTop = $("messages").scrollHeight;
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

(async function init() {
  try {
    const me = await api("/api/me");
    currentUser = me.username;
    $("me").textContent = currentUser;
    $("auth").classList.add("hidden");
    $("chat").classList.remove("hidden");
    connectWS();
    loadUsers();
    loadMessages();
  } catch {}
})();
