const socket = io(); // 連接到伺服器

const canvas = document.getElementById('drawing-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;
let isDrawer = false; // 用於區分是否是畫畫者

// 初始化畫布事件
if (canvas) {
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
}

function startDrawing(event) {
  if (!isDrawer) return; // 只有畫畫者能畫
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(event.offsetX, event.offsetY);
}

function draw(event) {
  if (!isDrawing || !isDrawer) return;
  ctx.lineTo(event.offsetX, event.offsetY);
  ctx.stroke();

  // 傳送畫畫數據到伺服器
  const drawData = {
    x: event.offsetX,
    y: event.offsetY,
    type: 'draw',
  };
  socket.emit('draw', drawData);
}

function stopDrawing() {
  if (isDrawing) {
    isDrawing = false;
    ctx.closePath();
  }
}

// 當伺服器發送畫畫數據
socket.on('draw', (data) => {
  if (data.type === 'draw') {
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  }
});

// 設置角色身份
socket.on('setDrawer', () => {
  isDrawer = true;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
});

socket.on('setGuesser', () => {
  isDrawer = false;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('word-to-draw').style.display = 'none'; // 猜測者看不到字詞
});

// 顯示角色提示
socket.on('turn', (message) => {
  document.getElementById('turn-message').innerText = message;
});

// 顯示畫畫者的字詞
socket.on('setWordToDraw', (word) => {
  if (isDrawer) {
    document.getElementById('word-to-draw').innerText = `請畫出: ${word}`;
  }
});

// 處理猜測結果
socket.on('correctGuess', (message) => alert(message));
socket.on('incorrectGuess', (message) => alert(message));

function sendGuess(guess) {
  if (!isDrawer) {
    socket.emit('guess', guess);
  } else {
    alert('你是畫畫者，不能猜測！');
  }
}

function startGame() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('wait-screen').style.display = 'block';
}
