const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);

// --- 1. CONFIGURATION MONGODB ---
// Remplace <db_password> par ton mot de passe réel (sans les < >)
const uri = "mongodb+srv://turkish9531_db_user:VtRDJIcmt0C4Ohx0@cluster0.dt0l2p2.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);
let messagesCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("radio95_db");
        messagesCollection = db.collection("messages");
        console.log("✅ Connecté à la base de données RADIO 95");
    } catch (e) {
        console.error("❌ Erreur de connexion MongoDB :", e);
    }
}
connectDB();

// --- 2. CONFIGURATION SERVEUR & SOCKET ---
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const ADMIN_PASSWORD = "95ADMIN";
const BLACKLIST = ["insulte1", "spam1", "mauvaislien"]; 

app.get('/', (req, res) => {
  res.send('<h1>Serveur RADIO 95 Connecté</h1>');
});

let onlineCount = 0;

// --- 3. LOGIQUE DU CHAT ---
io.on('connection', async (socket) => {
  onlineCount++;
  io.emit('user count', onlineCount);

  // ENVOI DE L'HISTORIQUE au nouvel utilisateur
  try {
    if (messagesCollection) {
      // On récupère les 50 derniers messages, triés par date
      const history = await messagesCollection.find().sort({ timestamp: -1 }).limit(50).toArray();
      // On les remet dans l'ordre chronologique avant l'envoi
      socket.emit('load history', history.reverse());
    }
  } catch (err) {
    console.error("Erreur récupération historique :", err);
  }

  // 1. GESTION DU PSEUDO
  socket.on('request pseudo', (data) => {
    io.emit('admin approval required', { 
      socketId: socket.id, 
      requestedPseudo: data.pseudo 
    });
  });

  socket.on('admin validate pseudo', (data) => {
    if (data.password === ADMIN_PASSWORD) {
      io.to(data.socketId).emit('pseudo approved', { 
        finalPseudo: data.finalPseudo 
      });
    }
  });

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

  // 2. RÉCEPTION ET SAUVEGARDE DES MESSAGES
  socket.on('chat message', async (data) => {
    // Modération
    const containsForbidden = BLACKLIST.some(word => 
      data.text.toLowerCase().includes(word)
    );

    if (containsForbidden) {
      socket.emit('chat message', {
        id: "bot-" + Date.now(),
        pseudo: 'BOT',
        text: '⚠️ Message bloqué (mot interdit).',
        color: '#ff4444'
      });
      return;
    }

    let finalRole = "user";
    let finalColor = data.color || '#ffffff';

    if (data.adminKey === ADMIN_PASSWORD) {
      finalRole = "admin";
      finalColor = "#FFD700"; 
    }

    const messageData = {
      id: data.id || Date.now() + Math.random(),
      pseudo: data.pseudo,
      text: data.text,
      color: finalColor,
      role: finalRole,
      timestamp: new Date() // Important pour l'historique
    };

    // SAUVEGARDE DANS MONGODB
    try {
      if (messagesCollection) {
        await messagesCollection.insertOne(messageData);
      }
    } catch (e) {
      console.error("Erreur sauvegarde message :", e);
    }

    io.emit('chat message', messageData);
  });

  // 3. LOGIQUE ADMIN
  socket.on('delete message', async (data) => {
    if (data.password === ADMIN_PASSWORD) {
      try {
        if (messagesCollection) {
          await messagesCollection.deleteOne({ id: data.messageId });
        }
        io.emit('remove message from ui', data.messageId);
      } catch (e) {
        console.error("Erreur suppression message :", e);
      }
    }
  });

  socket.on('admin broadcast', (data) => {
    if (data.password === ADMIN_PASSWORD) {
      io.emit('global announcement', { text: data.text });
    }
  });

  socket.on('reset all pseudos', (data) => {
    if (data.password === ADMIN_PASSWORD) {
      io.emit('force reset pseudo');
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

// --- 4. LANCEMENT ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur RADIO 95 opérationnel sur le port ${PORT}`);
});
