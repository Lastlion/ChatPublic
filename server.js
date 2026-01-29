const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// Dire au serveur de servir le fichier index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Logique du chat
io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');

  socket.on('chat message', (msg) => {
    // Diffuser le message à tout le monde
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
  });
});

// Configurer le port pour Render (important : 0.0.0.0)
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log('Serveur démarré sur le port ' + PORT);
});
