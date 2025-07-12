const socket = new WebSocket("ws://192.168.0.162:3000");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");
const attachBtn = document.getElementById("attach");
const name = localStorage.getItem("accountName") || "Anonymous";

let attachedImage = null;
let lastSender = null;

// Send name when connected
socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ type: "setName", name }));
});

// Send message on Enter
input.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const text = input.value.trim();
    if (text) {
      socket.send(JSON.stringify({ type: "text", text }));
      input.value = "";
    }

    if (attachedImage) {
      socket.send(JSON.stringify({
        type: "image",
        data: attachedImage
      }));
      attachedImage = null;
      attachBtn.textContent = "+";
    }
  }
});

// Receive messages
socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "system") {
    addSystemMessage(msg.text);
  } else if (msg.type === "text") {
    const isMe = msg.sender === name;
    addMessageToChat(msg.text, isMe ? "me" : "them", isMe ? "Me" : msg.sender);
  } else if (msg.type === "image") {
    const isMe = msg.sender === name;
    addImageToChat(msg.data, isMe ? "me" : "them", isMe ? "Me" : msg.sender);
  }
});

// Add text message
function addMessageToChat(text, senderClass, senderName) {
  if (senderName !== lastSender) {
    const nameTag = document.createElement("p");
    nameTag.className = "name";
    nameTag.textContent = senderName;
    messagesDiv.appendChild(nameTag);
    lastSender = senderName;
  }

  const div = document.createElement("div");
  div.className = senderClass;
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add image message
function addImageToChat(base64, senderClass, senderName) {
  if (senderName !== lastSender) {
    const nameTag = document.createElement("p");
    nameTag.className = "name";
    nameTag.textContent = senderName;
    messagesDiv.appendChild(nameTag);
    lastSender = senderName;
  }

  const img = document.createElement("img");
  img.src = `data:image/*;base64,${base64}`;
  img.className = "chat-image";
  messagesDiv.appendChild(img);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add system message
function addSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Attach image
attachBtn.addEventListener("click", () => {
  if (attachedImage) {
    attachedImage = null;
    attachBtn.textContent = "+";
    return;
  }

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.onchange = () => {
    const file = picker.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        attachedImage = reader.result.split(",")[1]; // base64 part
        attachBtn.textContent = "X";
      };
      reader.readAsDataURL(file);
    }
  };
  picker.click();
});
