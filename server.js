const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let wordToDraw = '樹';  // 假設這是畫畫的字詞

app.use(express.static('public'));  // 提供靜態檔案

// 當有玩家連接時
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  players.push(socket);

  // 當有兩個玩家時開始遊戲
  if (players.length === 2) {
    players[0].emit('turn', '你是畫畫的玩家！');
    players[0].emit('setDrawer');
    players[1].emit('turn', '你是猜畫的玩家！');
    players[0].emit('setWordToDraw', wordToDraw);
  }

  // 當玩家開始畫畫時，將畫的資料發送給其他玩家
  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  // 當玩家猜測字詞時
  socket.on('guess', (guess) => {
    if (guess === wordToDraw) {
      io.emit('correctGuess', '猜對了！');
    } else {
      io.emit('incorrectGuess', '猜錯了，繼續猜！');
    }
  });

  // 當玩家離開時，移除玩家
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    players = players.filter(player => player.id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
