/* script.js
   DAAI — 前端互動腳本 (示範版)
   - 模擬 GAI 回覆
   - 提供送出 code 到聊天視窗的行為（不執行使用者程式碼）
   - 留意：要串接真正 ChatGPT API，請在後端建立代理並在此以 fetch 呼叫
*/

// ---------- DOM references ----------
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');

const codeEditor = document.getElementById('codeEditor');
const submitCodeBtn = document.getElementById('submitCodeBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const clearEditorBtn = document.getElementById('clearEditorBtn');
const downloadBtn = document.getElementById('downloadBtn');
const editorStatus = document.getElementById('editorStatus');

const loadSampleBtn = document.getElementById('loadSampleBtn');
const clearProblemBtn = document.getElementById('clearProblemBtn');
const problemArea = document.getElementById('problemArea');


// ---------- Utilities ----------
function addMessage(role, htmlContent){
  // role: 'user' | 'ai'
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'ai');

  // allow preformatted content
  el.innerHTML = htmlContent;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// simple simulated AI reply — replace with backend call for real AI
function simulateAIResponse(promptText){
  // Basic heuristics to create different replies for code submission vs question
  return new Promise(resolve => {
    setTimeout(() => {
      let reply = '';

      if (/function|def|class|return|console\.log|print\(/i.test(promptText)){
        reply += `<strong>AI（模擬）回覆：</strong> 我已收到程式碼片段。以下為簡短檢視建議：<br/><pre>${escapeHtml(shortPreview(promptText, 400))}</pre>`;
        reply += `<div style="margin-top:8px;color:var(--muted)">建議：請說明你期望的輸入/輸出案例，或提供一個代表性的測試案例。</div>`;
      } else {
        reply += `<strong>AI（模擬）回覆：</strong> 我看到你的問題：「${escapeHtml(promptText)}」。<br/>如果你想讓我以魔鬼代言人（Devil's Advocate）風格質疑 AI，未來可切換模型設定。`;
      }

      resolve(reply);
    }, 680 + Math.random() * 700);
  });
}

function escapeHtml(str){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function shortPreview(text, maxLen=300){
  if(!text) return '';
  return text.length > maxLen ? text.slice(0,maxLen) + '\n\n...（已截斷）' : text;
}

function builtinRead(x) {
  if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
    throw "File not found: '" + x + "'";
  }
  return Sk.builtinFiles["files"][x];
}

function runPython(code) {
  return new Promise((resolve, reject) => {
    let output = "";

    Sk.configure({
      output: function (text) {
        // 收集 print() 的輸出
        output += text;
      },
      read: builtinRead,
      execLimit: 5000  // 避免無限迴圈卡住
    });

    // 將 Python 程式當作 <stdin> 執行
    Sk.misceval.asyncToPromise(function () {
      return Sk.importMainWithBody("<stdin>", false, code, true);
    }).then(function () {
      // 若程式完全沒有 print，給個提示
      if (!output.trim()) {
        output = "(程式無任何輸出；請確認是否有使用 print()。)";
      }
      resolve(output);
    }).catch(function (err) {
      reject(err.toString());
    });
  });
}

// ---------- Chat: send / receive ----------
async function sendChatMessage(){
  const text = chatInput.value.trim();
  if(!text) return;
  addMessage('user', `<div><strong>你：</strong> ${escapeHtml(text)}</div>`);
  chatInput.value = '';
  chatInput.focus();

  // Simulate "typing"
  addMessage('ai', `<div style="opacity:0.7;color:var(--muted)">AI 回覆中…</div>`);
  const lastPlaceholder = chatMessages.lastElementChild;

  try {
    const aiReplyHtml = await simulateAIResponse(text);

    // replace placeholder
    lastPlaceholder.remove();
    addMessage('ai', aiReplyHtml);
  } catch (err) {
    lastPlaceholder.remove();
    addMessage('ai', `<div style="color:var(--danger)">系統錯誤（模擬）：${escapeHtml(String(err))}</div>`);
  }
}

chatSendBtn.addEventListener('click', sendChatMessage);
chatForm.addEventListener('submit', e => { e.preventDefault(); sendChatMessage(); });
chatInput.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChatMessage(); } });

// ---------- Code editor: submit code ----------
submitCodeBtn.addEventListener('click', async () => {
  const code = codeEditor.value.trim();
  if (!code) {
    editorStatus.textContent = '請先在編輯區撰寫程式後再送出。';
    setTimeout(()=> editorStatus.textContent = '', 3000);
    return;
  }

  // 將程式碼當作一則「使用者訊息」送到對話區
  addMessage('user', `<div><strong>程式提交（Python）：</strong><pre>${escapeHtml(shortPreview(code, 800))}</pre></div>`);

  // 顯示執行中的提示
  addMessage('ai', `<div style="opacity:0.7;color:var(--muted)">程式執行中（Python）…</div>`);
  const placeholder = chatMessages.lastElementChild;

  try {
    const output = await runPython(code);   // 呼叫我們剛剛寫的 runPython

    placeholder.remove();
    addMessage('ai', `
      <div>
        <strong>程式執行結果 (stdout)：</strong>
        <pre>${escapeHtml(output)}</pre>
      </div>
    `);

    editorStatus.textContent = '程式已成功執行（Python）。';
    setTimeout(()=> editorStatus.textContent = '', 3500);

    // 保留原本的「提交紀錄」功能
    const history = JSON.parse(localStorage.getItem('daai_submissions') || '[]');
    history.push({ ts: Date.now(), code: code, output: output });
    localStorage.setItem('daai_submissions', JSON.stringify(history.slice(-30)));

  } catch (err) {
    placeholder.remove();
    addMessage('ai', `
      <div style="color:var(--danger)">
        <strong>程式執行錯誤：</strong>
        <pre>${escapeHtml(String(err))}</pre>
      </div>
    `);

    editorStatus.textContent = '程式執行發生錯誤，請查看錯誤訊息。';
    setTimeout(()=> editorStatus.textContent = '', 4000);
  }
});

// ---------- Editor helper buttons ----------

saveLocalBtn.addEventListener('click', () => {
  localStorage.setItem('daai_code_draft', codeEditor.value);
  editorStatus.textContent = '已儲存草稿至 LocalStorage';
  setTimeout(()=> editorStatus.textContent = '', 1600);
});

clearEditorBtn.addEventListener('click', () => {
  if(confirm('確定要清空編輯器內容？')) {
    codeEditor.value = '';
  }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([codeEditor.value], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'code.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---------- Problem controls ----------
loadSampleBtn.addEventListener('click', () => {
  problemArea.innerHTML = `<h4>題目：陣列加總 (示範)</h4>
  <p>請撰寫一個函式 <code>sumArray(arr)</code>，輸入為整數陣列，回傳陣列所有元素之和。</p>
  <p><em>示例：</em> sumArray([1,2,3]) => 6</p>`;
});

clearProblemBtn.addEventListener('click', () => {
  if(confirm('清除目前題目？')) problemArea.innerHTML = '';
});

// ---------- restore draft on load ----------
window.addEventListener('load', () => {
  const draft = localStorage.getItem('daai_code_draft');
  const draft = localStorage.getItem('daai_code_draft');
  if (draft) {
    codeEditor.value = draft;
  } else {
    codeEditor.value = "";  // 不載入任何預設程式碼
  }

  // Welcome message
  addMessage('ai', `<div><strong>系統：</strong> 歡迎使用 DAAI 範例系統。你可以在右側編輯器撰寫程式，按「確認並送出」會將程式提交給 AI（目前為模擬回覆）。亦可在下方與 AI 對談。</div>`);
});

// ---------- (示範) 與真實 ChatGPT API 串接的說明（註解） ----------
// 若要串接真實 ChatGPT，你應建立一個後端 API（例如 /api/chat）來代理 OpenAI 的呼叫。
// 前端送出內容到後端，後端再呼叫 OpenAI，最後回傳結果給前端。
// 主要原因：不建議在前端直接放 OpenAI API Key，會有資安風險。
// 範例（node/express）伺服器端流程：
// POST /api/chat { messages: [...] } -> server 使用 OpenAI SDK 呼叫 -> 回傳 reply
//
// 在此處可將 simulateAIResponse() 換成如下 fetch 範例：
// async function callRealAI(userText) {
//   const resp = await fetch('/api/chat', {
//     method:'POST', headers:{'Content-Type':'application/json'},
//     body: JSON.stringify({message: userText})
//   });
//   const data = await resp.json();
//   return data.replyHtml || data.replyText;
// }
