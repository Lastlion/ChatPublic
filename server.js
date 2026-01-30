const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// MOT DE PASSE ADMIN (À changer si tu veux)
const ADMIN_PASSWORD = "95ADMIN";

app.get('/', (req, res) => {
  res.send('<h1>Serveur Chat RADIO 95 en ligne</h1>');
});

let onlineCount = 0;

io.on('connection', (socket) => {
  onlineCount++;
  io.emit('user count', onlineCount);

  socket.on('new user', (pseudo) => {
    const name = typeof pseudo === 'object' ? pseudo.pseudo : pseudo;
    socket.pseudo = name;
    io.emit('chat message', {
      id: Date.now() + Math.random(),
      pseudo: 'SYSTÈME',
      text: `${name} a rejoint le chat 🎶`,
      color: '#00FF00'
    });
  });

  socket.on('chat message', (data) => {
    // On ajoute un ID unique à chaque message pour pouvoir le supprimer précisément
    const messageData = {
      id: data.id || Date.now() + Math.random(),
      pseudo: data.pseudo,
      text: data.text,
      color: data.color || '#ffffff'
    };
    io.emit('chat message', messageData);
  });

  // --- LOGIQUE ADMIN : SUPPRESSION ---
  socket.on('delete message', (data) => {
    // Vérification de sécurité côté serveur
    if (data.password === ADMIN_PASSWORD) {
      io.emit('remove message from ui', data.messageId);
    }
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('user count', onlineCount);
    if (socket.pseudo) {
      io.emit('chat message', {
        id: Date.now() + Math.random(),
        pseudo: 'SYSTÈME',
        text: `${socket.pseudo} a quitté le chat.`,
        color: '#FF4444'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
