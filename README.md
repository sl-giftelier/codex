# Ping Pong Classic

A retro-inspired browser ping pong game with responsive canvas rendering, mouse/touch steering, optional keyboard controls, and a lightweight AI opponent. A tiny Node.js static server is bundled so you can launch the experience consistently across browsers.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later

## Install

Install once so npm tracks the lockfile and scripts:

```bash
npm install
```

## Run the game

Start the bundled static server and open the printed URL (defaults to <http://localhost:3000>):

```bash
npm start
```

The server takes care of MIME types and keeps asset paths predictable, so the game loads without having to open local files manually.

## Tests

A lightweight syntax check is included to ensure the JavaScript stays valid:

```bash
npm test
```

## Controls

- Drag, mouse move, or touch the canvas to steer your paddle
- Use `W/S` or `↑/↓` for keyboard play
- First player to 5 points wins—hit **Start Game** (or **Play Again**) from the overlay to jump into a match

Enjoy the rally!
