const socket = io();

let currentColor = 'black'; // 預設畫筆顏色是黑色
let isEraserMode = false; // 橡皮擦模式開關

document.getElementById('join-room-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-id').value.trim();
  const playerName = document.getElementById('player-name').value.trim();

  if (roomId && playerName) {
    socket.emit('joinRoom', roomId, playerName);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('room-screen').style.display = 'block';
  } else {
    alert('請輸入房間名稱和玩家名稱！');
  }
});

document.getElementById('start-game-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('startGame', roomId);
});

socket.on('updatePlayers', (players) => {
  const playerList = document.getElementById('player-list');
  playerList.innerHTML = ''; // 清空玩家列表
  players.forEach(player => {
    const listItem = document.createElement('li');
    listItem.textContent = player.name;
    playerList.appendChild(listItem);
  });
});

socket.on('isRoomOwner', () => {
  document.getElementById('start-game-btn').style.display = 'block';
});

socket.on('gameStarted', ({ drawer, word }) => {
  alert(`${drawer.name} 是畫畫者，準備開始遊戲！`);

  if (socket.id === drawer.id) {
    document.getElementById('word-to-draw').innerText = `你的題目是：${word}`;
    enableDrawing(); // 只有畫畫者能畫
    document.getElementById('clear-btn').style.display = 'block';
  } else {
    document.getElementById('word-to-draw').innerText = '';
    disableDrawing(); // 禁止其他人畫
    document.getElementById('clear-btn').style.display = 'none';
  }

  document.getElementById('room-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
});

// 顏色選擇
document.getElementById('red').addEventListener('click', () => {
  currentColor = 'red';
  document.getElementById('brush-icon').style.filter = 'invert(25%) sepia(81%) saturate(289%) hue-rotate(0deg) brightness(93%) contrast(88%)'; // 顯示紅色的畫筆
});
document.getElementById('orange').addEventListener('click', () => {
  currentColor = 'orange';
  document.getElementById('brush-icon').style.filter = 'invert(22%) sepia(49%) saturate(533%) hue-rotate(5deg) brightness(87%) contrast(82%)'; // 顯示橙色的畫筆
});
document.getElementById('yellow').addEventListener('click', () => {
  currentColor = 'yellow';
  document.getElementById('brush-icon').style.filter = 'invert(79%) sepia(99%) saturate(4200%) hue-rotate(4deg) brightness(108%) contrast(120%)'; // 顯示黃色的畫筆
});
document.getElementById('green').addEventListener('click', () => {
  currentColor = 'green';
  document.getElementById('brush-icon').style.filter = 'invert(47%) sepia(60%) saturate(317%) hue-rotate(75deg) brightness(108%) contrast(96%)'; // 顯示綠色的畫筆
});
document.getElementById('black').addEventListener('click', () => {
  currentColor = 'black';
  document.getElementById('brush-icon').style.filter = 'none'; // 顯示黑色的畫筆
});

// 切換到橡皮擦模式
document.getElementById('eraser-btn').addEventListener('click', () => {
  isEraserMode = !isEraserMode; // 切換橡皮擦模式
  if (isEraserMode) {
    document.getElementById('eraser-btn').style.backgroundColor = '#ddd'; // 顯示橡皮擦被選中
  } else {
    document.getElementById('eraser-btn').style.backgroundColor = ''; // 取消橡皮擦選中
  }
});

// 繪圖相關
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let lastPos = null;

function enableDrawing() {
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mousemove', draw);
}

function disableDrawing() {
  canvas.removeEventListener('mousedown', startDrawing);
  canvas.removeEventListener('mouseup', stopDrawing);
  canvas.removeEventListener('mousemove', draw);
}

function startDrawing(e) {
  drawing = true;
  lastPos = { x: e.offsetX, y: e.offsetY };
}

function stopDrawing() {
  drawing = false;
  lastPos = null;
}

function draw(e) {
  if (!drawing) return;

  const currentPos = { x: e.offsetX, y: e.offsetY };

  if (isEraserMode) {
    erase(currentPos); // 如果是橡皮擦模式，使用橡皮擦
  } else {
    drawLine(lastPos, currentPos); // 如果是畫筆模式，畫線
  }

  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('draw', roomId, { start: lastPos, end: currentPos, color: currentColor, eraser: isEraserMode });
  lastPos = currentPos;
}

function drawLine(start, end) {
  if (!start || !end) return;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 5;
  ctx.stroke();
}

function erase(position) {
  ctx.clearRect(position.x - 10, position.y - 10, 20, 20); // 用橡皮擦擦除畫布上的部分
}

socket.on('draw', (data) => {
  if (data.eraser) {
    erase(data.end);
  } else {
    drawLine(data.start, data.end);
  }
});

document.getElementById('clear-btn').addEventListener('click', () => {
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('clearCanvas', roomId);
});

socket.on('clearCanvas', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 猜測功能
document.getElementById('guess-btn').addEventListener('click', () => {
  const guess = document.getElementById('guess-input').value.trim();
  const roomId = document.getElementById('room-id').value.trim();
  if (guess) {
    socket.emit('guess', roomId, guess);
    document.getElementById('guess-input').value = ''; // 清空輸入框
  }
});

socket.on('correctGuess', (message) => alert(message));
socket.on('incorrectGuess', (message) => alert(message));
