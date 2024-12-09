/*server.js*/
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {};


let currentRound = 0;  // 記錄當前回合數
let score = 0;  // 記錄分數
// 題庫和回合相關變數
const words = ['蘋果', '香蕉', '汽車', '狗', '貓', '樹', '房子', '太陽', '月亮', '花']; // 題庫
const maxRounds = 5; // 每局遊戲最多進行的回合數


app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log(`玩家 ${socket.id} 已連接`);





  socket.on('joinRoom', (roomId, playerName) => {
    if (!rooms[roomId]) {
      //rooms[roomId] = { players: [], gameStarted: false };


      rooms[roomId] = {
        players: [],
        gameStarted: false,
        currentRound: 0,      // 當前回合數
        maxRounds: 5,        // 最大回合數（可調整）
        scores: {},          // 玩家分數
        usedWords: [],       // 已使用的題目
    };



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

    /*

    // 隨機選擇畫畫者
    const drawerIndex = Math.floor(Math.random() * room.players.length);
    room.drawer = room.players[drawerIndex];
    // 隨機選擇題目



    const words = ['蘋果', '香蕉', '汽車', '狗', '貓', '樹', '房子', '太陽', '月亮', '花'];

    room.word = words[Math.floor(Math.random() * words.length)];

*/


    if (room && room.players.length > 1) {
    room.gameStarted = true;
    room.currentRound = 1; // 初始化回合數
    room.scores = room.players.reduce((acc, player) => {
      acc[player.id] = 0; // 初始化每個玩家的分數為 0
      return acc;
    }, {});

    startRound(roomId); // 開始第一回合
  }

    // 發送遊戲開始的訊息，並且給畫家題目
    io.to(roomId).emit('gameStarted', {
      drawer: room.drawer,
      word: room.word,  // 所有玩家都能收到題目
    });
  }
});


  socket.on('draw', (roomId, data) => {
    const room = rooms[roomId];
    if (room && room.drawer.id === socket.id) {

      // 只有畫家能畫畫
    socket.to(roomId).emit('draw', {
      start: data.start,
      end: data.end,
      color: room.drawer.color, // 傳送畫家的顏色
      eraser: data.eraser
    });
      // 只有畫畫者才能畫畫
     // socket.to(roomId).emit('draw', data);


    }
  });

  socket.on('colorChanged', (roomId, color) => {
  const room = rooms[roomId];
  if (room && room.drawer.id === socket.id) {

    // 更新畫家的顏色
    room.drawer.color = color;

    // 當畫家變更顏色時，廣播顏色給其他玩家
    socket.to(roomId).emit('colorChanged', color);
  }
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


function startRound(roomId) {
  const room = rooms[roomId];
  if (!room || room.currentRound > maxRounds) {
    io.to(roomId).emit('gameEnded', room.scores); // 遊戲結束，傳送最終分數
    return;
  }


  room.currentRound++; // 增加回合數


  const drawerIndex = room.currentRound % room.players.length; // 輪流選擇畫家
  room.drawer = room.players[drawerIndex];



  // 隨機選題，避免重複
  let word;
  do {
    word = words[Math.floor(Math.random() * words.length)];
  } while (room.usedWords.includes(word) && room.usedWords.length < words.length);
  room.word = word;
  room.usedWords.push(word);

  // 廣播給玩家，僅畫家看到題目
  io.to(room.drawer.id).emit('gameStarted', {
    drawer: room.drawer,
    word: room.word  // 顯示題目給畫家
  });

  // 通知其他玩家遊戲開始（不包括題目）
  room.players.forEach(player => {
    if (player.id !== room.drawer.id) {
      io.to(player.id).emit('gameStarted', {
        drawer: room.drawer
      });
    }
  });

  // 清空畫布並開始遊戲
  io.to(roomId).emit('clearCanvas');

}






// 產生新的題目並設定畫家
function startNewRound() {
    currentRound++;  // 增加回合數
    if (currentRound > topics.length) {
        currentRound = 1; // 回合數超過題庫數量後重新開始
    }
    
    // 隨機選擇一個題目
    const topic = topics[currentRound - 1]; // 根據回合數選擇題目
    
    // 更新遊戲狀態
    displayNewRound(topic);  // 顯示新的回合
    resetCanvas();  // 重設畫布
    updateUIForNewRound(); // 更新UI（畫家或猜題者界面）

    console.log(`Round ${currentRound} starts. Topic: ${topic}`);
}

// 顯示新的回合
function displayNewRound(topic) {
    // 如果是畫家，顯示題目
    if (isDrawer) {
        document.getElementById('topic').textContent = `Draw: ${topic}`;
    } else {
        document.getElementById('topic').textContent = ''; // 猜題者不應該看到題目
    }
}

// 重設畫布
function resetCanvas() {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布
}

// 更新UI（畫家或猜題者界面）
function updateUIForNewRound() {
    if (isDrawer) {
        // 畫家的界面，啟用顏色選擇、橡皮擦、清除畫布等功能
        enableDrawingTools(true);
        document.getElementById('clearButton').disabled = false;
        document.getElementById('eraseButton').disabled = false;
    } else {
        // 猜題者的界面，禁用畫筆工具
        enableDrawingTools(false);
        document.getElementById('clearButton').disabled = true;
        document.getElementById('eraseButton').disabled = true;
    }
}

// 啟用或禁用畫畫工具
function enableDrawingTools(enable) {
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.disabled = !enable;
}

// 每回合結束時呼叫
function endRound(roomId, isCorrect) {
  const room = rooms[roomId];
  if (isCorrect) {
    room.scores[room.drawer.id] += 10;  // 畫家猜對時加分
  }

  // 顯示分數
  io.to(roomId).emit('updateScores', room.scores);

  // 等待 2 秒鐘後開始新回合
  setTimeout(() => {
    if (room.currentRound < maxRounds) {
      startRound(roomId);  // 開始新回合
    } else {
      io.to(roomId).emit('gameEnded', room.scores); // 當回合數達到最大時結束遊戲
    }
  }, 2000);  // 等待 2 秒後開始新回合
}

io.on('connection', (socket) => {
  console.log(`玩家 ${socket.id} 已連接`);

  socket.on('startGame', (roomId) => {
    const room = rooms[roomId];

    if (room && room.players.length > 1) {
      room.gameStarted = true;
      room.currentRound = 1; // 初始化回合數
      room.scores = room.players.reduce((acc, player) => {
        acc[player.id] = 0; // 初始化每個玩家的分數
        return acc;
      }, {});

      startRound(roomId); // 開始第一回合
    }
  });

  socket.on('guess', (roomId, guess) => {
    const room = rooms[roomId];
    if (room && room.word === guess) {
      io.to(roomId).emit('correctGuess', `${guess} 是正確答案！`);
      endRound(roomId, true);  // 猜對後結束回合
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