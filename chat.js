const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");
const attachBtn = document.getElementById("attach");
const codeBoxes = document.querySelectorAll(".code");
const name = localStorage.getItem("accountName") || "Anonymous";

let attachedImage = null;
let lastSender = null;
let secretKey = null;
let socket = null;
let skipGenerate = false;

// === SANITIZATION HELPER ===
function escapeHTML(str) {
  return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

// === ENCRYPTION HELPERS ===
function generateCode(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function deriveKey(code) {
  const enc = new TextEncoder().encode(code);
  const keyMaterial = await crypto.subtle.importKey("raw", enc, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
  );
}

async function encrypt(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, secretKey, encoded);
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(ciphertext)))}`;
}

async function decrypt(encoded) {
  const [ivB64, ctB64] = encoded.split(".");
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, secretKey, ct);
  return new TextDecoder().decode(plaintext);
}

// === JOIN HANDLING ===
const existing = localStorage.getItem("joinChatCode");
if (existing) {
  codeBoxes.forEach((el, i) => (el.textContent = existing[i]));
  skipGenerate = true;

  deriveKey(existing).then((key) => {
    secretKey = key;
    initSocket();
  });

  localStorage.removeItem("joinChatCode");
}

// === CREATE NEW CHAT ===
if (!skipGenerate) {
  const chatCode = generateCode();
  codeBoxes.forEach((el, i) => (el.textContent = chatCode[i]));

  deriveKey(chatCode).then((key) => {
    secretKey = key;
    initSocket();
  });
}

// === WEBSOCKET + CHAT LOGIC ===
function initSocket() {
  const ip = localStorage.getItem("serverIP") || "localhost";
  socket = new WebSocket(`ws://${ip}:3000`);

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "setName", name }));

    const chatCode = skipGenerate
        ? existing
        : Array.from(codeBoxes).map(box => box.textContent).join("");

    socket.send(JSON.stringify({ type: "join", code: chatCode }));
  });

  socket.addEventListener("message", async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "system") {
      addSystemMessage(msg.text);
    }

    if (msg.type === "text") {
      try {
        const decrypted = await decrypt(msg.text);
        addMessageToChat(
            decrypted,
            msg.sender === name ? "me" : "them",
            msg.sender === name ? "Me" : msg.sender
        );
      } catch (err) {
        console.error("Decryption error:", err);
      }
    }

    if (msg.type === "image") {
      addImageToChat(
          msg.data,
          msg.sender === name ? "me" : "them",
          msg.sender === name ? "Me" : msg.sender
      );
    }
  });
}

// === MESSAGE SENDING ===
input.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = input.value.trim();
    if (text && secretKey && socket?.readyState === 1) {
      const encrypted = await encrypt(text);
      socket.send(JSON.stringify({ type: "text", text: encrypted }));
      input.value = "";
    }

    if (attachedImage && socket?.readyState === 1) {
      socket.send(JSON.stringify({ type: "image", data: attachedImage }));
      attachedImage = null;
      attachBtn.textContent = "+";
    }
  }
});

// === IMAGE ATTACHMENT ===
attachBtn.addEventListener("click", () => {
  if (attachedImage) {
    attachedImage = null;
    attachBtn.textContent = "+";
    return;
  }

  const filePicker = document.createElement("input");
  filePicker.type = "file";
  filePicker.accept = "image/*";

  filePicker.onchange = () => {
    const file = filePicker.files[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      alert("Invalid image file. Must be an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      if (!/^[A-Za-z0-9+/=]+={0,2}$/.test(base64)) {
        alert("Invalid image data.");
        return;
      }
      attachedImage = base64;
      attachBtn.textContent = "X";
    };
    reader.readAsDataURL(file);
  };

  filePicker.click();
});

// === DISPLAY HELPERS ===
function addMessageToChat(text, cls, sender) {
  if (sender !== lastSender) {
    const nameTag = document.createElement("p");
    nameTag.className = "name";
    nameTag.textContent = escapeHTML(sender);
    messagesDiv.appendChild(nameTag);
    lastSender = sender;
  }

  const div = document.createElement("div");
  div.className = cls;
  div.textContent = escapeHTML(text);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addImageToChat(base64, cls, sender) {
  if (sender !== lastSender) {
    const nameTag = document.createElement("p");
    nameTag.className = "name";
    nameTag.textContent = escapeHTML(sender);
    messagesDiv.appendChild(nameTag);
    lastSender = sender;
  }

  const img = document.createElement("img");
  img.src = `data:image/*;base64,${base64}`;
  img.className = "chat-image";
  messagesDiv.appendChild(img);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const sys = document.createElement("div");
  sys.className = "system";
  sys.textContent = escapeHTML(text);
  messagesDiv.appendChild(sys);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
