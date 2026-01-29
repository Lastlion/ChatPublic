io.on('connection', (socket) => {
  // Quand un utilisateur envoie son pseudo juste après la connexion
  socket.on('new user', (pseudo) => {
    socket.pseudo = pseudo;
    // On diffuse à TOUT LE MONDE que quelqu'un est arrivé
    io.emit('chat message', { 
      pseudo: 'SYSTÈME', 
      text: `👋 ${pseudo} vient de rejoindre la radio !` 
    });
  });

  socket.on('chat message', (data) => {
    io.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    if (socket.pseudo) {
      io.emit('chat message', { 
        pseudo: 'SYSTÈME', 
        text: `🚪 ${socket.pseudo} a quitté le chat.` 
      });
    }
  });
});
