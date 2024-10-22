const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the static files if needed, otherwise just run the signaling server.
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle WebRTC offer messages
  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer); // Send offer to the other peer
  });

  // Handle WebRTC answer messages
  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer); // Send answer to the other peer
  });

  // Handle ICE candidate messages
  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate); // Send ICE candidate to the other peer
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(5000, () => {
  console.log('Server is listening on port 5000');
});