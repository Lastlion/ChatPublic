 const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// 1. Force le serveur à utiliser le dossier actuel pour trouver index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Utilisateur connecté');

  socket.on('chat message', (msg) => {
    // Renvoie le message à TOUT LE MONDE
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté');
  });
});

// 3. TRÈS IMPORTANT : Utiliser process.env.PORT pour Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Serveur en ligne sur le port ${PORT}`);
});
