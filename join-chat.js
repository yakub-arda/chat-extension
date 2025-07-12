const inputs = document.querySelectorAll(".code-input");

inputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
        // Keep only letters, but DO NOT convert to uppercase
        input.value = input.value.replace(/[^a-zA-Z]/g, "");

        if (input.value && idx < inputs.length - 1) {
            inputs[idx + 1].focus();
        }

        if (inputsAreFilled()) {
            const code = Array.from(inputs).map(i => i.value).join("");
            sessionStorage.setItem("chatCode", code);
            localStorage.setItem("joinChatCode", code); // <--- important
            window.location.href = "chat.html";
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && idx > 0) {
            inputs[idx - 1].focus();
        }
    });
});

function inputsAreFilled() {
    return Array.from(inputs).every(input => input.value.length === 1);
}

inputs[0].focus();

const joinForm = document.getElementById("join-form");
const codeInput = document.getElementById("chat-code");

joinForm.addEventListener("submit", e => {
    e.preventDefault();
    const code = codeInput.value.trim();
    if (/^[A-Za-z]{4}$/.test(code)) {
        localStorage.setItem("joinChatCode", code); // <--- important
        window.location.href = "chat.html";
    } else {
        alert("Enter exactly 4 letters");
    }
});
