const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 顯示訊息
function addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.style.margin = "10px 0";
    msg.innerHTML = `<b>${sender}：</b> ${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 按下送出
sendBtn.addEventListener("click", () => {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("你", text);
    userInput.value = "";

    // 回傳一個模擬的 AI 回應
    setTimeout(() => {
        addMessage("AI", "這是一個示範回應（正式版可串接 OpenAI API）");
    }, 500);
});
