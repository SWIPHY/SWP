// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Variables d'environnement (à configurer sur Render)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;       // salon Discord cible
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ""; // secret optionnel

// Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Endpoint HTTP pour recevoir les messages du raccourci iPhone
app.post('/send', async (req, res) => {
  try {
    // Vérification du secret (optionnelle)
    if (WEBHOOK_SECRET) {
      const auth = req.headers['authorization'] || '';
      if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== WEBHOOK_SECRET) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing 'content'" });

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    await channel.send(content);
    res.json({ status: 'ok', content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Lancer le serveur HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur HTTP lancé sur le port ${PORT}`);
});

// Lancer le bot
client.login(DISCORD_TOKEN);