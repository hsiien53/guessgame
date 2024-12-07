const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let wordToDraw = '樹';  // 假設的畫題，這可以是隨機的

// 提供靜態檔案 (將 public 資料夾中的檔案作為靜態資源)
app.use(express.static('public'));

// 伺服器設定
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  players.push(socket);

  // 當兩個玩家都連接時，開始遊戲
  if (players.length === 2) {
    players[0].emit('turn', '你是畫畫的玩家！');
    players[0].emit('setDrawer'); // 設定玩家1為畫家
    players[1].emit('turn', '你是猜畫的玩家！'); // 玩家2為猜畫者
    players[0].emit('setWordToDraw', wordToDraw); // 傳遞畫題給畫家
  }

  // 當畫家畫圖時，廣播給其他玩家
  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data); // 廣播畫圖資料給其他玩家
  });

  // 玩家猜測
  socket.on('guess', (guess) => {
    if (guess === wordToDraw) {
      io.emit('correctGuess', '猜對了！');
    } else {
      io.emit('incorrectGuess', '猜錯了，繼續猜！');
    }
  });

  // 玩家斷線時
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    players = players.filter(player => player.id !== socket.id);
  });
});

// 設定伺服器端口，這裡使用 process.env.PORT 來支持 Vercel 等雲平台
const port = process.env.PORT || 3000;  // 若有 Vercel 提供的 PORT，使用它，否則使用 3000
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
