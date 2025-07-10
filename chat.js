const socket = new WebSocket("ws://192.168.1.100:3000"); // Replace with your local server IP

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");

socket.addEventListener("message", (event) => {
  const msg = document.createElement("div");
  msg.textContent = event.data;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

sendButton.addEventListener("click", () => {
  const text = input.value;
  if (text) {
    socket.send(text);
    input.value = "";
  }
});