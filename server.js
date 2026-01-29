const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  // On prévient tout le monde qu'un utilisateur arrive
  socket.on('new user', (pseudo) => {
    socket.pseudo = pseudo;
    io.emit('chat message', { pseudo: 'Système', text: `${pseudo} a rejoint le chat !` });
  });

  socket.on('chat message', (data) => {
    // data contient maintenant { pseudo: "...", text: "..." }
    io.emit('chat message', data);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log('Serveur actif sur le port ' + PORT);
});
