const socket = io();  // 連接到伺服器

// 當伺服器發送 "turn" 時
socket.on('turn', (message) => {
  console.log(message);  // 顯示玩家是畫畫者還是猜測者
  document.getElementById('turn-message').innerText = message;
});

// 當伺服器發送 "setDrawer" 時
socket.on('setDrawer', () => {
  console.log('你是畫畫者');
  // 顯示畫畫工具
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('guess-screen').style.display = 'none';
});

// 當伺服器發送 "setWordToDraw" 時
socket.on('setWordToDraw', (word) => {
  console.log('字詞是:', word);
  // 顯示畫畫者要畫的字詞
  document.getElementById('word-to-draw').innerText = word;
});

// 當伺服器發送 "correctGuess" 時
socket.on('correctGuess', (message) => {
  alert(message);
});

// 當伺服器發送 "incorrectGuess" 時
socket.on('incorrectGuess', (message) => {
  alert(message);
});

// 當玩家畫畫時
function sendDraw(data) {
  socket.emit('draw', data);
}

// 當玩家猜測字詞時
function sendGuess(guess) {
  socket.emit('guess', guess);
}
