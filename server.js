const express = require('express');
const socketIo = require('socket.io');

const app = express();
const server = require('http').Server(app);
const io = socketIo(server);

let players = [];
let wordToDraw = '樹';  // 假設的畫題，這可以是隨機的

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

// 必須將伺服器函數導出，以便 Vercel 認識它
module.exports = (req, res) => {
  server.emit('request', req, res);
};
