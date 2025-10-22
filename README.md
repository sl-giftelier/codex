# Ping Pong Arcade

A browser-based ping pong game featuring single-player AI and local two-player modes. The project now ships with a tiny Node.js server so you can run it the same way across browsers instead of double-clicking the HTML file.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later

## Install

No dependencies are required, but grab the project dependencies so npm will track the lock file.

```bash
npm install
```

## Run the game

Start the bundled server and open the URL it prints (defaults to <http://localhost:3000>).

```bash
npm start
```

The server keeps the static assets in sync and handles correct MIME types so scripts always execute.

## Tests

The project includes a lightweight syntax check to make sure the JavaScript stays valid.

```bash
npm test
```

## Controls

- **Single player**: Move with `W/S`, `↑/↓`, or drag/tap on the table
- **Two player**: Player 1 uses `W/S`, Player 2 uses `↑/↓`
- Press **Restart Match** or **Start Match** in the overlay to reset the game

Enjoy the rally!
