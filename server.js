const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });

let messages = [];

wss.on("connection", (ws) => {
  ws._name = "Anonymous";

  // Send messages from last 30 mins
  const cutoff = Date.now() - 30 * 60 * 1000;
  messages.filter(m => m.timestamp > cutoff).forEach((msg) => {
    ws.send(JSON.stringify(msg));
  });

  const joinMsg = {
    type: "system",
    text: `${ws._name} joined.`,
    timestamp: Date.now()
  };
  broadcast(joinMsg);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "setName") {
      ws._name = msg.name;
      return;
    }

    if (msg.type === "text" || msg.type === "image") {
      const fullMsg = {
        ...msg,
        sender: ws._name,
        timestamp: Date.now()
      };
      messages.push(fullMsg);
      broadcast(fullMsg);
    }
  });

  ws.on("close", () => {
    const leaveMsg = {
      type: "system",
      text: `${ws._name} left.`,
      timestamp: Date.now()
    };
    broadcast(leaveMsg);
  });
});

function broadcast(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}
