// ===== AI 對話模擬 =====
const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage("你", text);
    chatInput.value = "";

    // 模擬回覆（未串 ChatGPT）
    setTimeout(() => {
        addMessage("AI", "這是模擬回覆，之後會串接真正的 GAI API。");
    }, 600);
});

function addMessage(sender, message) {
    const msg = document.createElement("div");
    msg.innerHTML = `<strong>${sender}：</strong> ${message}`;
    msg.style.marginBottom = "10px";
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ===== 程式碼提交（目前僅示範，不執行 Python） =====
document.getElementById("run-btn").addEventListener("click", () => {
    alert("程式已送出（之後會串接 OnlineGDB 或後端執行服務）");
});
