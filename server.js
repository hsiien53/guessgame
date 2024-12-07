const express = require('express');
const http = require('http');
const socketIo = require('socket.io');  // 使用 socket.io 套件

const app = express();
const server = http.createServer(app); // 創建 HTTP 伺服器
const io = socketIo(server);  // 在伺服器上初始化 socket.io

let players = [];
let wordToDraw = '樹';

app.use(express.static('public')); // 提供靜態文件

// 監聽客戶端的 socket 連接
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  players.push(socket);

  if (players.length === 2) {
    players[0].emit('turn', '你是畫畫的玩家！');
    players[0].emit('setDrawer');
    players[1].emit('turn', '你是猜畫的玩家！');
    players[0].emit('setWordToDraw', wordToDraw);
  }

  // 當收到畫圖資料時
  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data); // 廣播畫圖資料給其他玩家
  });

  // 當收到猜測字詞時
  socket.on('guess', (guess) => {
    if (guess === wordToDraw) {
      io.emit('correctGuess', '猜對了！');
    } else {
      io.emit('incorrectGuess', '猜錯了，繼續猜！');
    }
  });

  // 當玩家斷線時
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    players = players.filter(player => player.id !== socket.id);
  });
});

// 使用 Render 提供的端口環境變數
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
