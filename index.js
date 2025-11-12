// index.js (version améliorée)
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const process = require('process');

const app = express();
app.use(express.json());

// Vars d'environnement
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

// Vérifications initiales
if (!DISCORD_TOKEN) {
  console.error("ERROR: DISCORD_TOKEN missing");
  process.exit(1);
}
if (!CHANNEL_ID) {
  console.error("ERROR: CHANNEL_ID missing");
  process.exit(1);
}

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`Bot connecté en tant ${client.user.tag} (id: ${client.user.id})`);
});

// Health check (utile pour debug, évite Cannot POST / si GET racine)
app.get('/', (req, res) => res.json({ status: 'ok', bot: client.user ? client.user.tag : 'not connected' }));

// Endpoint POST /send
app.post('/send', async (req, res) => {
  try {
    // Vérification du header Authorization si secret configuré
    if (WEBHOOK_SECRET) {
      const auth = req.headers['authorization'] || '';
      if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== WEBHOOK_SECRET) {
        console.warn('Unauthorized request attempt');
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing 'content' field" });

    // Récupérer le channel (fetch si nécessaire)
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    await channel.send(String(content));
    return res.json({ status: 'ok', content });
  } catch (err) {
    console.error('Error in /send:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Catch-all pour éviter "Cannot POST /" si quelqu'un fait POST racine
app.post('/', (req, res) => res.status(404).json({ error: 'Use /send' }));

// Start Express
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Serveur HTTP lancé sur le port ${PORT}`);
});

// Handle process errors to éviter crash silent
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});

// Enfin, lancer le bot
client.login(DISCORD_TOKEN).catch(err => {
  console.error('Failed to login Discord client:', err);
  process.exit(1);
});