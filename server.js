const socket = io();

// 顯示登錄畫面
document.getElementById('login-screen').style.display = 'block';
document.getElementById('game-screen').style.display = 'none';

let isDrawer = false;

socket.on('turn', (message) => {
  alert(message);
});

socket.on('setDrawer', () => {
  isDrawer = true;
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('login-screen').style.display = 'none';
  // 讓畫家開始畫畫
});

socket.on('setWordToDraw', (word) => {
  alert(`你要畫的字是: ${word}`);
  // 顯示畫圖區域
});

// 當玩家開始畫畫時，將畫筆的資料發送給後端
function sendDrawingData(data) {
  socket.emit('draw', data);
}

// 玩家猜測字詞
function sendGuess(guess) {
  socket.emit('guess', guess);
}

socket.on('correctGuess', (message) => {
  alert(message);
});

socket.on('incorrectGuess', (message) => {
  alert(message);
});
