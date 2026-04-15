# Real-Time Multiplayer Chess ♟️

A fully functional, real-time multiplayer chess application built with a focus on seamless state synchronization and a clean user interface. Players can join a session, play against each other with live updates, and track their game via integrated timers.

## 🚀 Features

* **Real-Time Gameplay:** Bidirectional communication ensures moves are updated instantly across both clients using **Socket.io**.
* **Dynamic Board Orientation:** The board automatically flips to match the perspective of the player (White or Black).
* **Live Timers:** Synchronized countdown timers for both players to keep the game moving.
* **Hint System:** Integrated logic to suggest possible moves during gameplay.
* **Responsive UI:** A clean, modern interface designed for focus and playability.

## 📸 Preview

![Chess Game Screenshot](./screenshot.png) 
*(Note: Add the screenshot you shared to the root of your repo and name it `screenshot.png`, or update this path)*

## 🛠️ Tech Stack

* **Frontend:** HTML/CSS/JavaScript (or list React/Next.js if applicable)
* **Backend:** Node.js, Express.js
* **Real-Time Communication:** Socket.io

## 🚦 Getting Started

Follow these steps to run the game locally on your machine.

### Prerequisites

* [Node.js](https://nodejs.org/) installed on your machine.
* Git for cloning the repository.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/rajveer3x/chessGame.git](https://github.com/rajveer3x/chessGame.git)
    cd chessGame
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    *(If your start command is different, like `node server.js`, replace the command above).*

4.  **Open the application:**
    Open your browser and navigate to `http://localhost:3000`. To test multiplayer functionality locally, open the same link in an incognito window or a different browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rajveer3x/chessGame/issues).

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
