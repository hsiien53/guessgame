//client.js//
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


// 當遊戲開始
socket.on('gameStarted', ({ drawer, word }) => {
  alert(`${drawer.name} 是畫家，準備開始遊戲！`);

  if (socket.id === drawer.id) {
    document.getElementById('word-to-draw').innerText = `你的題目是：${word}`; // 顯示畫家的題目
    enableDrawing(); // 只有畫家能畫
    document.getElementById('clear-btn').style.display = 'block'; // 顯示清除畫布按鈕
    document.getElementById('guess-input').style.display = 'none';// 顯示畫畫工具
    document.getElementById('tool-options').style.display = 'block';
    document.getElementById('guess-btn').style.display = 'none';
    document.getElementById('color-palette').style.display = 'block';
  } else {
    document.getElementById('word-to-draw').innerText = ''; // 其他玩家看不到題目
    disableDrawing(); // 禁止其他玩家作畫
    document.getElementById('clear-btn').style.display = 'none'; 
    document.getElementById('guess-input').style.display = 'block';// 隱藏清除畫布按鈕
    document.getElementById('guess-btn').style.display = 'block';
    document.getElementById('tool-options').style.display = 'none';
    document.getElementById('color-palette').style.display = 'none';
  }

  document.getElementById('room-screen').style.display = 'none'; // 隱藏房間畫面
  document.getElementById('game-screen').style.display = 'block'; // 顯示遊戲畫面
});






socket.on('finishDrawing', (roomId) => {
  const room = rooms[roomId];
  if (room) {
    room.currentRound += 1; // 回合數加 1
    startRound(roomId); // 開始下一回合
  }
});



socket.on('gameEnded', (scores) => {
  alert('遊戲結束！最終得分：\n' + 
    Object.entries(scores).map(([id, score]) => `${id}: ${score}`).join('\n'));
  location.reload(); // 結束遊戲後刷新頁面
});







/*

// 顏色選擇
document.getElementById('red').addEventListener('click', () => {
  currentColor = 'red';
});
document.getElementById('orange').addEventListener('click', () => {
  currentColor = 'orange';
});
document.getElementById('yellow').addEventListener('click', () => {
  currentColor = 'yellow';
});
document.getElementById('green').addEventListener('click', () => {
  currentColor = 'green';
});
document.getElementById('black').addEventListener('click', () => {
  currentColor = 'black';
});


*/





// 當接收到顏色變更事件時，更新畫布顏色
socket.on('colorChanged', (color) => {
  currentColor = color;  // 更新當前顏色
  // 更新畫筆顏色
  ctx.strokeStyle = currentColor;
});

// 顏色選擇事件
document.getElementById('red').addEventListener('click', () => {
  currentColor = 'red';
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('colorChanged', roomId, currentColor);  // 發送顏色變更到伺服器
});

document.getElementById('orange').addEventListener('click', () => {
  currentColor = 'orange';
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('colorChanged', roomId, currentColor);  // 發送顏色變更到伺服器
});

document.getElementById('yellow').addEventListener('click', () => {
  currentColor = 'yellow';
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('colorChanged', roomId, currentColor);  // 發送顏色變更到伺服器
});

document.getElementById('green').addEventListener('click', () => {
  currentColor = 'green';
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('colorChanged', roomId, currentColor);  // 發送顏色變更到伺服器
});

document.getElementById('black').addEventListener('click', () => {
  currentColor = 'black';
  const roomId = document.getElementById('room-id').value.trim();
  socket.emit('colorChanged', roomId, currentColor);  // 發送顏色變更到伺服器
});

// 當接收到畫圖事件時，使用伺服器提供的顏色繪製
socket.on('draw', (data) => {
  if (data.eraser) {
    erase(data.end);
  } else {
    drawLine(data.start, data.end, data.color);  // 使用伺服器提供的顏色
  }
});

// 繪圖函式，新增一個顏色參數來設定顏色
function drawLine(start, end, color) {
  if (!start || !end) return;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;  // 設定顏色為伺服器提供的顏色
  ctx.lineWidth = 5;
  ctx.stroke();
}











// 橡皮擦模式
document.getElementById('eraser-btn').addEventListener('click', () => {
  isEraserMode = !isEraserMode; 
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
    erase(currentPos); // 使用橡皮擦
  } else {
    drawLine(lastPos, currentPos); // 畫畫
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

// 清除畫布
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