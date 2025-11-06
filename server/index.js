const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Game state storage
const rooms = new Map();
const players = new Map(); // socketId -> player info

// Word prompts for the game
const prompts = [
  "Cat", "Dog", "Elephant", "Giraffe", "Penguin", "Dolphin", "Butterfly",
  "Rainbow", "Sunset", "Castle", "Rocket", "Tornado", "Volcano", "Waterfall",
  "Pizza", "Ice Cream", "Sandwich", "Birthday Cake", "Coffee", "Donut",
  "Superhero", "Wizard", "Robot", "Alien", "Pirate", "Cowboy", "Ninja",
  "Guitar", "Piano", "Drums", "Microphone", "Headphones", "Radio",
  "Bicycle", "Car", "Airplane", "Train", "Boat", "Helicopter",
  "Tree House", "Lighthouse", "Windmill", "Tent", "Igloo", "Bridge",
  "Telescope", "Microscope", "Compass", "Map", "Treasure Chest", "Key"
];

function generateRandomPrompt() {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function createRoom(roomId, hostId) {
  rooms.set(roomId, {
    id: roomId,
    hostId,
    players: [],
    gameState: 'waiting', // waiting, playing, results
    currentRound: 0,
    chains: [], // Array of {playerId, entries: [{type, content, playerId}]}
    roundTime: 90, // seconds per turn
    started: false
  });
}

function addPlayerToRoom(roomId, playerId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return false;
  
  if (room.players.find(p => p.id === playerId)) {
    return true; // Already in room
  }
  
  room.players.push({
    id: playerId,
    name: playerName,
    ready: false
  });
  
  // Initialize chain for this player
  room.chains.push({
    playerId,
    entries: []
  });
  
  return true;
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.players.length < 3) return false;
  
  room.gameState = 'playing';
  room.started = true;
  room.currentRound = 0;
  
  // Shuffle players for rotation order
  const shuffled = [...room.players].sort(() => Math.random() - 0.5);
  room.playerOrder = shuffled;
  
  // Initialize chains - each chain starts with its original owner
  // but currentOwner tracks who should work on it now
  room.chains = shuffled.map((player, index) => ({
    originalPlayerId: player.id, // Who started this chain
    currentOwnerId: player.id,    // Who should work on it now
    entries: [{
      type: 'prompt',
      content: generateRandomPrompt(),
      playerId: player.id,
      round: 0
    }]
  }));
  
  return true;
}

function submitEntry(roomId, playerId, entry) {
  const room = rooms.get(roomId);
  if (!room) return false;
  
  // Find the chain that this player should currently work on
  const chainIndex = room.chains.findIndex(c => c.currentOwnerId === playerId);
  if (chainIndex === -1) return false;
  
  const chain = room.chains[chainIndex];
  const round = chain.entries.length;
  
  chain.entries.push({
    ...entry,
    playerId,
    round
  });
  
  // Check if all players have submitted
  const allSubmitted = room.chains.every(chain => 
    chain.entries.length === room.currentRound + 2
  );
  
  if (allSubmitted) {
    room.currentRound++;
    
    // Check if game is complete (each chain has been through all players)
    if (room.currentRound >= room.players.length) {
      room.gameState = 'results';
    } else {
      // Rotate chains
      rotateChains(room);
    }
  }
  
  return true;
}

function rotateChains(room) {
  // Rotate chains so each player gets the next player's chain
  // Move currentOwnerId to the next player in the order
  room.chains.forEach((chain, index) => {
    const currentOwnerIndex = room.playerOrder.findIndex(
      p => p.id === chain.currentOwnerId
    );
    const nextOwnerIndex = (currentOwnerIndex + 1) % room.playerOrder.length;
    chain.currentOwnerId = room.playerOrder[nextOwnerIndex].id;
  });
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('create-room', (data) => {
    const { roomId, playerName } = data;
    players.set(socket.id, { id: socket.id, name: playerName, roomId });
    createRoom(roomId, socket.id);
    addPlayerToRoom(roomId, socket.id, playerName);
    socket.join(roomId);
    socket.emit('room-created', { roomId });
    io.to(roomId).emit('room-updated', rooms.get(roomId));
  });
  
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    if (room.started) {
      socket.emit('join-error', { message: 'Game already started' });
      return;
    }
    
    players.set(socket.id, { id: socket.id, name: playerName, roomId });
    if (addPlayerToRoom(roomId, socket.id, playerName)) {
      socket.join(roomId);
      socket.emit('joined-room', { roomId });
      io.to(roomId).emit('room-updated', rooms.get(roomId));
    } else {
      socket.emit('join-error', { message: 'Failed to join room' });
    }
  });
  
  socket.on('start-game', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    const player = players.get(socket.id);
    
    if (!room || room.hostId !== socket.id) {
      socket.emit('start-error', { message: 'Only host can start the game' });
      return;
    }
    
    if (startGame(roomId)) {
      io.to(roomId).emit('game-started', rooms.get(roomId));
    } else {
      socket.emit('start-error', { message: 'Need at least 3 players to start' });
    }
  });
  
  socket.on('submit-entry', (data) => {
    const { roomId, entry } = data;
    const player = players.get(socket.id);
    
    if (submitEntry(roomId, socket.id, entry)) {
      const room = rooms.get(roomId);
      io.to(roomId).emit('entry-submitted', { 
        playerId: socket.id,
        room: room
      });
      
      // Check if round is complete
      const allSubmitted = room.chains.every(chain => 
        chain.entries.length === room.currentRound + 2
      );
      
      if (allSubmitted && room.gameState === 'playing') {
        if (room.currentRound >= room.players.length) {
          io.to(roomId).emit('game-complete', room);
        } else {
          io.to(roomId).emit('round-complete', room);
        }
      }
    }
  });
  
  socket.on('get-room-state', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('room-state', room);
    }
  });
  
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player && player.roomId) {
      const room = rooms.get(player.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(player.roomId);
        } else {
          io.to(player.roomId).emit('room-updated', room);
        }
      }
    }
    players.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

