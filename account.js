const displayName = document.getElementById("displayName");
const input = document.getElementById("accountName");
const saveBtn = document.getElementById("saveBtn");
const generateBtn = document.getElementById("generateBtn");

function randomName() {
    const animals = ["Fox", "Wolf", "Tiger", "Panda", "Owl", "Hawk", "Lynx"];
    const adjectives = ["Fast", "Dark", "Shadow", "Fire", "Silent", "Master"];
    const number = Math.floor(Math.random() * 900 + 100);
    return (
        adjectives[Math.floor(Math.random() * adjectives.length)] +
        animals[Math.floor(Math.random() * animals.length)] +
        number
    );
}

// Only assign random name if not saved already
window.onload = () => {
    const savedName = localStorage.getItem("accountName");
    const currentName = savedName || randomName();
    input.value = currentName;
    displayName.textContent = currentName;

    // Save the generated one if no name exists
    if (!savedName) {
        localStorage.setItem("accountName", currentName);
    }
};

saveBtn.onclick = () => {
    const name = input.value.trim();
    if (name) {
        localStorage.setItem("accountName", name);
        displayName.textContent = name;
    }
};

generateBtn.onclick = () => {
    const newName = randomName();
    input.value = newName;
    displayName.textContent = newName;
    localStorage.setItem("accountName", newName);
};