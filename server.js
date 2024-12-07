const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let wordToDraw = '樹';

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  players.push(socket);

  if (players.length === 2) {
    players[0].emit('turn', '你是畫畫的玩家！');
    players[0].emit('setDrawer');
    players[1].emit('turn', '你是猜畫的玩家！');
    players[0].emit('setWordToDraw', wordToDraw);
  }

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('guess', (guess) => {
    if (guess === wordToDraw) {
      io.emit('correctGuess', '猜對了！');
    } else {
      io.emit('incorrectGuess', '猜錯了，繼續猜！');
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    players = players.filter(player => player.id !== socket.id);
  });
});

// Render 使用 `PORT` 環境變數來設定端口
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
