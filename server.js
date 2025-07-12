const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });

let messagesByRoom = {}; // { ROOMCODE: [message1, message2, ...] }
let clientsByRoom = {};  // { ROOMCODE: Set of WebSocket clients }

wss.on("connection", (ws) => {
  ws._name = "Anonymous";
  ws._room = null;

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

    if (msg.type === "join") {
      const code = msg.code.toUpperCase();
      ws._room = code;

      if (!clientsByRoom[code]) {
        clientsByRoom[code] = new Set();
        messagesByRoom[code] = [];
      }

      clientsByRoom[code].add(ws);

      // Send last 50 minutes of messages
      const cutoff = Date.now() - 50 * 60 * 1000;
      messagesByRoom[code]
          .filter(m => m.timestamp > cutoff)
          .forEach(m => ws.send(JSON.stringify(m)));

      // Broadcast system join message
      const joinMsg = {
        type: "system",
        text: `${ws._name} joined the server.`,
        timestamp: Date.now()
      };
      broadcastToRoom(code, joinMsg);
    }

    if ((msg.type === "text" || msg.type === "image") && ws._room) {
      const fullMsg = {
        ...msg,
        sender: ws._name,
        timestamp: Date.now()
      };
      messagesByRoom[ws._room].push(fullMsg);
      broadcastToRoom(ws._room, fullMsg);
    }
  });

  ws.on("close", () => {
    if (ws._room && clientsByRoom[ws._room]) {
      clientsByRoom[ws._room].delete(ws);
      const leaveMsg = {
        type: "system",
        text: `${ws._name} left the server.`,
        timestamp: Date.now()
      };
      broadcastToRoom(ws._room, leaveMsg);
    }
  });
});

function broadcastToRoom(code, msg) {
  const json = JSON.stringify(msg);
  (clientsByRoom[code] || []).forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}
