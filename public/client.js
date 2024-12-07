const socket = io();

// 獲取畫布元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io({
  transports: ['websocket', 'polling']  // 設置 WebSocket 傳輸或輪詢
});

let isDrawer = false;  // 確認玩家是否是畫家
let drawing = false;   // 確認是否正在繪製
let wordToDraw = '';  // 設定待畫的詞語

// 畫布大小設定
canvas.width = 800;
canvas.height = 600;

// 登入畫面邏輯
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  if (username) {
    socket.emit('login', username);  // 發送登入請求到伺服器

    // 設置登入後顯示的遊戲畫面
    document.getElementById('login-screen').style.display = 'none';  // 隱藏登入畫面
    document.getElementById('game-screen').style.display = 'block';  // 顯示遊戲畫面
  }
});

// 畫圖函數
function draw(e) {
  if (!drawing || !isDrawer) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000000';

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);

  // 發送繪圖數據到伺服器
  socket.emit('draw', { x, y });
}

// 畫布事件處理：當滑鼠按下開始畫圖
canvas.addEventListener('mousedown', (e) => {
  if (!isDrawer) return;
  drawing = true;
  draw(e);  // 開始畫圖並立即畫出第一筆
});

// 畫布事件處理：滑鼠移動時繪製
canvas.addEventListener('mousemove', (e) => {
  if (!drawing || !isDrawer) return;
  draw(e);
});

// 畫布事件處理：滑鼠鬆開停止畫圖
canvas.addEventListener('mouseup', () => {
  drawing = false;
  ctx.beginPath();
});

// 畫布事件處理：滑鼠離開畫布停止畫圖
canvas.addEventListener('mouseout', () => {
  drawing = false;
  ctx.beginPath();
});

// 接收伺服器發送的畫圖數據
socket.on('draw', (data) => {
  console.log('Received draw data:', data);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000000';

  ctx.lineTo(data.x, data.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(data.x, data.y);
});

// 接收伺服器的遊戲狀態
socket.on('turn', (message) => {
  document.getElementById('game-status').innerText = message;
  if (message.includes('畫畫')) {
    isDrawer = true;
  } else {
    isDrawer = false;
  }
});

// 接收伺服器的出題字
socket.on('setWordToDraw', (word) => {
  wordToDraw = word;  // 設定待畫的字
});

// 接收伺服器的正確猜測訊息
socket.on('correctGuess', (message) => {
  alert(message);  // 顯示猜對訊息
});

// 接收伺服器的錯誤猜測訊息
socket.on('incorrectGuess', (message) => {
  alert(message);  // 顯示猜錯訊息
});

// 玩家猜測
function sendGuess() {
  const guess = document.getElementById('guess').value;
  if (guess) {
    socket.emit('guess', guess);
  }
}
