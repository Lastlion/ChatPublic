const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuration CORS pour autoriser ton site Neocities
const io = new Server(server, {
  cors: {
    origin: "*", // Permet à n'importe quel site de se connecter (Utile pour Neocities)
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Route par défaut pour vérifier que le serveur tourne
app.get('/', (req, res) => {
  res.send('<h1>Serveur Chat RADIO 95 en ligne</h1>');
});

io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');

  // Quand un nouvel utilisateur rejoint (avec son pseudo)
  socket.on('new user', (pseudo) => {
    socket.pseudo = pseudo;
    // Envoie un message système à tout le monde
    io.emit('chat message', {
      pseudo: 'SYSTÈME',
      text: `${pseudo} a rejoint le chat 🎶`
    });
  });

  // Quand un message est envoyé
  socket.on('chat message', (data) => {
    // On renvoie le message à TOUT LE MONDE (y compris l'expéditeur)
    io.emit('chat message', {
      pseudo: data.pseudo,
      text: data.text
    });
  });

  socket.on('disconnect', () => {
    if (socket.pseudo) {
      io.emit('chat message', {
        pseudo: 'SYSTÈME',
        text: `${socket.pseudo} a quitté le chat.`
      });
    }
    console.log('Un utilisateur s\'est déconnecté');
  });
});

// Port dynamique pour Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
