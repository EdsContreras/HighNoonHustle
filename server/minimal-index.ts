import express from "express";
import { createServer } from "http";

const app = express();
app.use(express.json());

// Create a basic server
const server = createServer(app);

// Simple hello world route
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello, world!' });
});

// Serve a simple response for the root path
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Game Test</title>
      </head>
      <body>
        <h1>Game Server is Working</h1>
        <p>The game server is running successfully!</p>
      </body>
    </html>
  `);
});

// Start the server
const port = 5000;
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  console.log(`Server running on port ${port}`);
});