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
        word: room.drawer.id === socket.id ? room.word : null,
      });
    }
  });

  socket.on('draw', (roomId, data) => {
    const room = rooms[roomId];
    if (room && room.drawer.id === socket.id) {
      // 只有畫畫者才能畫畫
      socket.to(roomId).emit('draw', data);
    }
  });

  socket.on('colorChanged', (roomId, color) => {
    // 當顏色變更時，廣播顏色給其他玩家
    socket.to(roomId).emit('colorChanged', color);
  });

  socket.on('clearCanvas', (roomId) => {
    const room = rooms[roomId];
    if (room && room.drawer.id === socket.id) {
      // 只有畫畫者才能清除畫布
      io.to(roomId).emit('clearCanvas');
    }
  });

  socket.on('guess', (roomId, guess) => {
    const room = rooms[roomId];
    if (room && room.word === guess) {
      io.to(roomId).emit('correctGuess', `${guess} 是正確答案！`);
    } else {
      socket.emit('incorrectGuess', `${guess} 錯誤，再試試！`);
    }
  });

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
