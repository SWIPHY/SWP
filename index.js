// index.js
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const process = require('process');

const app = express();
app.use(express.json());

// === Variables d'environnement ===
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

// Vérification basique
if (!DISCORD_TOKEN || !CHANNEL_ID) {
  console.error("❌ DISCORD_TOKEN ou CHANNEL_ID manquant !");
  process.exit(1);
}

// === Bot Discord ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// === Route GET (test santé) ===
app.get('/', (req, res) => {
  res.json({ status: 'ok', bot: client.user ? client.user.tag : 'not connected' });
});

// === Route POST /send ===
app.post('/send', async (req, res) => {
  try {
    // Sécurité
    if (WEBHOOK_SECRET) {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== WEBHOOK_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing 'content'" });

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send(content);

    res.json({ status: 'ok', content });
  } catch (err) {
    console.error('❌ Erreur /send :', err);
    res.status(500).json({ error: err.message });
  }
});

// === Démarrage serveur ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur HTTP prêt sur le port ${PORT}`));

// === Connexion bot ===
client.login(DISCORD_TOKEN);