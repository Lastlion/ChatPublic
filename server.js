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

app.get('/', (req, res) => {
  res.send('<h1>Serveur Chat RADIO 95 en ligne</h1>');
});

// --- LOGIQUE DES CONNECTÉS ---
let onlineCount = 0;

io.on('connection', (socket) => {
  // On augmente le compteur et on informe tout le monde
  onlineCount++;
  io.emit('user count', onlineCount);
  console.log('Utilisateurs connectés:', onlineCount);

  // Quand un nouvel utilisateur rejoint
  socket.on('new user', (pseudo) => {
    // Gestion si le pseudo est un objet ou une string
    const name = typeof pseudo === 'object' ? pseudo.pseudo : pseudo;
    socket.pseudo = name;
    
    io.emit('chat message', {
      pseudo: 'SYSTÈME',
      text: `${name} a rejoint le chat 🎶`,
      color: '#00FF00' // Vert pour le système
    });
  });

  // Quand un message est envoyé
  socket.on('chat message', (data) => {
    // On renvoie TOUTES les données (pseudo, text, color)
    io.emit('chat message', {
      pseudo: data.pseudo,
      text: data.text,
      color: data.color || '#ffffff'
    });
  });

  socket.on('disconnect', () => {
    // On diminue le compteur et on informe tout le monde
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('user count', onlineCount);

    if (socket.pseudo) {
      io.emit('chat message', {
        pseudo: 'SYSTÈME',
        text: `${socket.pseudo} a quitté le chat.`,
        color: '#FF4444' // Rouge pour le système
      });
    }
    console.log('Un utilisateur est parti. Reste:', onlineCount);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
