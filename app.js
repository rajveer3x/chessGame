const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

// --- TIMER SETTINGS ---
let playerTimes = { w: 600, b: 600 }; // 600 seconds = 10 minutes
let timerInterval = null;

const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        // Only count down if both players are connected
        if (players.white && players.black) {
            const turn = chess.turn(); // 'w' or 'b'
            playerTimes[turn]--;

            // Send time to everyone
            io.emit("timeUpdate", playerTimes);

            // Check if time ran out
            if (playerTimes[turn] <= 0) {
                clearInterval(timerInterval);
                const winner = turn === 'w' ? "Black" : "White";
                io.emit("gameOver", { winner: winner, reason: "Time Out" });
            }
        }
    }, 1000);
};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess Game" });
});

io.on('connection', function(uniqueSocket) {
    console.log("Connected");

    // Assign Roles
    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit('playerRole', 'b');
    } else {
        uniqueSocket.emit('spectatorRole');
    }

    // Send initial board and time
    uniqueSocket.emit('boardState', chess.fen());
    uniqueSocket.emit('timeUpdate', playerTimes);

    uniqueSocket.on("disconnect", function() {
        if (uniqueSocket.id === players.white) {
            delete players.white;
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
        }
    });

    uniqueSocket.on('move', function(move) {
        try {
            // Validate Turn
            if (chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniqueSocket.id !== players.black) return;

            const result = chess.move(move);
            
            if (result) {
                currentPlayer = chess.turn();
                
                // Start timer on first move
                if (!timerInterval) startTimer();

                io.emit('move', move);
                io.emit('boardState', chess.fen()); // Re-send board for captured pieces logic

                // Check Game Over
                if (chess.game_over()) {
                    clearInterval(timerInterval);
                    let reason = "";
                    let winner = "";
                    
                    if (chess.in_checkmate()) {
                        reason = "Checkmate";
                        winner = chess.turn() === 'w' ? "Black" : "White";
                    } else if (chess.in_draw()) {
                        reason = "Draw";
                        winner = "None";
                    } else {
                        reason = "Game Over";
                        winner = "None";
                    }
                    io.emit("gameOver", { winner: winner, reason: reason });
                }
            } else {
                uniqueSocket.emit('invalidMove', move);
            }
        } catch (err) {
            uniqueSocket.emit('invalidMove', move);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});