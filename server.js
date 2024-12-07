const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log(`玩家 ${socket.id} 已連接`);

  // 玩家加入房間
  socket.on('joinRoom', (roomId, playerName) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], gameStarted: false };
    }

    const room = rooms[roomId];
    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomId);

    io.to(roomId).emit('updatePlayers', room.players);

    // 如果玩家是房主，告知可以開始遊戲
    if (room.players.length === 1) {
      socket.emit('isRoomOwner');
    }
  });

  // 開始遊戲
  socket.on('startGame', (roomId) => {
    const room = rooms[roomId];
    if (room && room.players.length > 1) {
      room.gameStarted = true;

      // 隨機選擇畫畫者
      const drawerIndex = Math.floor(Math.random() * room.players.length);
      room.drawer = room.players[drawerIndex];
      room.word = '樹'; // 可以改為隨機題目生成

      // 發送遊戲開始的訊息，並且給畫畫者題目
      io.to(roomId).emit('gameStarted', {
        drawer: room.drawer,
        word: room.drawer.id === socket.id ? room.word : null, // 只有畫畫者可以看到題目
      });
    }
  });

  // 畫畫
  socket.on('draw', (roomId, data) => {
    const room = rooms[roomId];
    if (room && room.drawer.id === socket.id) {
      // 只有畫畫者才能畫畫
      socket.to(roomId).emit('draw', data);
    }
  });

  // 清除畫布
  socket.on('clearCanvas', (roomId) => {
    const room = rooms[roomId];
    if (room && room.drawer.id === socket.id) {
      // 只有畫畫者才能清除畫布
      io.to(roomId).emit('clearCanvas');
    }
  });

  // 猜測字詞
  socket.on('guess', (roomId, guess) => {
    const room = rooms[roomId];
    if (room && room.word === guess) {
      io.to(roomId).emit('correctGuess', `${guess} 是正確答案！`);
    } else {
      socket.emit('incorrectGuess', `${guess} 錯誤，再試試！`);
    }
  });

  // 斷開連接
  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.players = room.players.filter(player => player.id !== socket.id);

      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('updatePlayers', room.players);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`伺服器運行中，監聽端口：${PORT}`);
});
