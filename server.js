const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let wordToDraw = '樹'; // 要畫的字詞

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  players.push(socket);

  // 如果兩個玩家都連接了，分配角色
  if (players.length === 2) {
    players[0].emit('turn', '你是畫畫的玩家！');
    players[0].emit('setDrawer');
    players[1].emit('turn', '你是猜畫的玩家！');
    players[1].emit('setGuesser');
    players[0].emit('setWordToDraw', wordToDraw);
  }

  // 處理畫畫數據
  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data); // 廣播畫畫數據給其他玩家
  });

  // 處理猜測
  socket.on('guess', (guess) => {
    if (guess === wordToDraw) {
      io.emit('correctGuess', '猜對了！遊戲結束！');
    } else {
      io.emit('incorrectGuess', '猜錯了，繼續猜！');
    }
  });

  // 玩家斷線
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    players = players.filter(player => player.id !== socket.id);
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
