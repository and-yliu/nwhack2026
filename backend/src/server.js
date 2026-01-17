import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js'; // Import default export
import socketHandlers from './src/sockets/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 1. Create Raw HTTP Server (wrapping Express)
const server = http.createServer(app);

// 2. Attach Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// 3. Initialize Sockets
socketHandlers(io);

// 4. Start Listening
server.listen(PORT, () => {
    console.log(`> Server running on port ${PORT}`);
});