const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

// UI Elements
const timerWhite = document.getElementById("timer-white");
const timerBlack = document.getElementById("timer-black");
const capturedWhite = document.getElementById("captured-white");
const capturedBlack = document.getElementById("captured-black");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            // Coordinates
            if (squareindex === 0) {
                const rank = document.createElement("span");
                rank.classList.add("coordinate", "rank");
                rank.innerText = 8 - rowindex;
                squareElement.appendChild(rank);
            }
            if (rowindex === 7) {
                const file = document.createElement("span");
                file.classList.add("coordinate", "file");
                file.innerText = String.fromCharCode(97 + squareindex);
                squareElement.appendChild(file);
            }

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
        document.body.classList.add("flex-col-reverse"); 
    } else {
        boardElement.classList.remove("flipped");
        document.body.classList.remove("flex-col-reverse");
    }
    
    updateCapturedPieces();
    createHintButton(); 
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔",
        P: "♟", R: "♜", N: "♞", B: "♝", Q: "♛", K: "♚",
    };
    return unicodePieces[piece.type] || "";
};

// --- TIMERS ---
const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

socket.on("timeUpdate", (times) => {
    timerWhite.innerText = formatTime(times.w);
    timerBlack.innerText = formatTime(times.b);
    
    // Clear highlights on new turn
    document.querySelectorAll('.highlight-hint').forEach(el => el.classList.remove('highlight-hint'));

    if(chess.turn() === 'w') {
        timerWhite.classList.add("bg-yellow-500", "text-black");
        timerWhite.classList.remove("bg-gray-700");
        timerBlack.classList.remove("bg-yellow-500", "text-black");
        timerBlack.classList.add("bg-gray-700");
    } else {
        timerBlack.classList.add("bg-yellow-500", "text-black");
        timerBlack.classList.remove("bg-gray-700");
        timerWhite.classList.remove("bg-yellow-500", "text-black");
        timerWhite.classList.add("bg-gray-700");
    }
});

// --- CAPTURED PIECES ---
const updateCapturedPieces = () => {
    const board = chess.board();
    const pieceCounts = {
        w: { p: 0, r: 0, n: 0, b: 0, q: 0 },
        b: { p: 0, r: 0, n: 0, b: 0, q: 0 }
    };

    board.flat().forEach(square => {
        if (square) {
            pieceCounts[square.color][square.type]++;
        }
    });

    const startingPieces = { p: 8, r: 2, n: 2, b: 2, q: 1 };

    const renderCaptured = (color, container) => {
        container.innerHTML = "";
        for (const type in startingPieces) {
            const capturedCount = startingPieces[type] - pieceCounts[color][type];
            for (let i = 0; i < capturedCount; i++) {
                const icon = document.createElement("span");
                icon.innerText = getPieceUnicode({ type: type, color: color }); 
                icon.classList.add("captured-piece");
                container.appendChild(icon);
            }
        }
    };

    renderCaptured('w', capturedWhite);
    renderCaptured('b', capturedBlack);
};

// --- AI HINT LOGIC (Fixed Placement & Faster) ---
const createHintButton = () => {
    // Remove old button if it exists
    if(document.getElementById("hint-btn")) document.getElementById("hint-btn").remove();

    const btn = document.createElement("button");
    btn.id = "hint-btn";
    btn.innerText = "💡 Hint";
    btn.classList.add(
        "px-3", "py-1", "bg-blue-600", "hover:bg-blue-700", 
        "text-white", "font-bold", "rounded", "shadow", 
        "transition", "duration-200", "text-sm", "mx-4" // Added margin mx-4
    );

    // 1. DYNAMIC PLACEMENT: Insert INSIDE the bar, not floating above
    let myControlsId = playerRole === 'b' ? "controls-black" : "controls-white";
    const myControls = document.getElementById(myControlsId);
    
    if(myControls) {
        // We want to insert it before the last element (the Timer)
        // Structure is: [Name+Captured] [Timer]
        // We want: [Name+Captured] [Hint] [Timer]
        myControls.insertBefore(btn, myControls.lastElementChild);
    }

    btn.addEventListener("click", async () => {
        if (chess.game_over()) return alert("Game is over!");
        if (playerRole && chess.turn() !== playerRole) return alert("It's not your turn!");

        btn.innerText = "Thinking...";
        btn.disabled = true;

        try {
            const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');
            const blob = new Blob([await response.text()], { type: 'application/javascript' });
            const stockfish = new Worker(URL.createObjectURL(blob));

            stockfish.postMessage("position fen " + chess.fen());
            
            // 2. SPEED FIX: Reduced depth from 15 to 10
            stockfish.postMessage("go depth 10"); 

            stockfish.onmessage = function(event) {
                if (event.data.includes("bestmove")) {
                    const bestMove = event.data.split(" ")[1]; 
                    
                    highlightMove(bestMove);

                    btn.innerText = "💡 Hint";
                    btn.disabled = false;
                    stockfish.terminate(); 
                }
            };
        } catch (err) {
            console.error(err);
            btn.innerText = "Error";
            btn.disabled = false;
        }
    });
};

const highlightMove = (moveStr) => {
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);

    const getSquareElement = (algebraic) => {
        const file = algebraic.charCodeAt(0) - 97; 
        const rank = 8 - parseInt(algebraic[1]);   
        return document.querySelector(`.square[data-row="${rank}"][data-col="${file}"]`);
    };

    document.querySelectorAll('.highlight-hint').forEach(el => el.classList.remove('highlight-hint'));

    const fromEl = getSquareElement(from);
    const toEl = getSquareElement(to);

    if (fromEl) fromEl.classList.add("highlight-hint");
    if (toEl) toEl.classList.add("highlight-hint");
};

// --- SOCKET EVENTS ---
socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});
socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});
socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});
socket.on("gameOver", (data) => {
    alert(`Game Over! Winner: ${data.winner} Reason: ${data.reason}`);
});

renderBoard();