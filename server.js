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

// --- CONFIGURATION ADMIN & MODÉRATION ---
const ADMIN_PASSWORD = "95ADMIN";

// Ajoute ici les mots que tu veux interdire (en minuscules)
const BLACKLIST = ["insulte1", "spam1", "mauvaislien"]; 

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
      id: "sys-" + Date.now(),
      pseudo: 'SYSTÈME',
      text: `${name} a rejoint le chat 🎶`,
      color: '#00FF00'
    });
  });

  socket.on('chat message', (data) => {
    // 1. MODÉRATION AUTOMATIQUE
    const containsForbidden = BLACKLIST.some(word => 
      data.text.toLowerCase().includes(word)
    );

    if (containsForbidden) {
      socket.emit('chat message', {
        id: "bot-" + Date.now(),
        pseudo: 'BOT',
        text: '⚠️ Votre message a été bloqué (mot interdit).',
        color: '#ff4444'
      });
      return;
    }

    // 2. GESTION DES GRADES (ADMIN)
    let finalRole = "user";
    let finalPseudo = data.pseudo;
    let finalColor = data.color || '#ffffff';

    if (data.adminKey === ADMIN_PASSWORD) {
      finalRole = "admin";
      finalColor = "#FFD700"; 
    }

    // 3. ENVOI DU MESSAGE À TOUT LE MONDE
    io.emit('chat message', {
      id: data.id || Date.now() + Math.random(),
      pseudo: finalPseudo,
      text: data.text,
      color: finalColor,
      role: finalRole 
    });
  });

  // --- LOGIQUE ADMIN : SUPPRESSION ---
  socket.on('delete message', (data) => {
    if (data.password === ADMIN_PASSWORD) {
      io.emit('remove message from ui', data.messageId);
    }
  });

  // --- LOGIQUE ADMIN : ANNONCE GLOBALE (AJOUTÉ) ---
  socket.on('admin broadcast', (data) => {
    if (data.password === ADMIN_PASSWORD) {
      io.emit('global announcement', { text: data.text });
    }
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('user count', onlineCount);
    if (socket.pseudo) {
      io.emit('chat message', {
        id: "sys-out-" + Date.now(),
        pseudo: 'SYSTÈME',
        text: `${socket.pseudo} a quitté le chat.`,
        color: '#FF4444'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur RADIO 95 prêt sur le port ${PORT}`);
});
