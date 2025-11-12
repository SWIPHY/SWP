// index.js
'use strict';

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const process = require('process');

const app = express();
app.use(express.json({ limit: '128kb' })); // limite raisonnable

// === Configuration via ENV ===
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; // string ou number
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''; // string (recommandé)
const PORT = parseInt(process.env.PORT || '3000', 10);

// === Vérifications initiales ===
if (!DISCORD_TOKEN) {
  console.error('FATAL: DISCORD_TOKEN is not set');
  process.exit(1);
}
if (!CHANNEL_ID) {
  console.error('FATAL: CHANNEL_ID is not set');
  process.exit(1);
}

// === Discord client ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`✅ Discord client ready as ${client.user.tag} (id=${client.user.id})`);
});

// catch discord login errors
client.on('error', (err) => console.error('Discord client error:', err));

// === Health route ===
app.get('/', (req, res) => {
  res.json({ status: 'ok', bot: client.user ? client.user.tag : 'connecting' });
});

// middleware simple de sécurité (secret)
function checkSecret(req, res, next) {
  if (!WEBHOOK_SECRET) return next(); // si non configuré, passe (dev only)
  const auth = (req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return res.status(403).json({ error: 'Forbidden' });
  const token = auth.split(' ')[1];
  if (token !== WEBHOOK_SECRET) return res.status(403).json({ error: 'Forbidden' });
  return next();
}

// Endpoint principal pour envoyer un message
app.post('/send', checkSecret, async (req, res) => {
  try {
    const body = req.body || {};
    // Accept either { content: "text" } OR { embed: { title: "...", description: "..." } }
    const content = body.content;
    const embed = body.embed;

    if (!content && !embed) {
      return res.status(400).json({ error: "Missing 'content' or 'embed' in JSON body" });
    }

    // fetch channel
    let channel;
    try {
      channel = await client.channels.fetch(String(CHANNEL_ID));
    } catch (err) {
      console.error('Failed to fetch channel:', err);
      return res.status(500).json({ error: 'Channel fetch failed' });
    }
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ error: 'Channel not found or not text' });
    }

    // send message
    const sendOptions = {};
    if (content) sendOptions.content = String(content);
    if (embed) sendOptions.embeds = [embed]; // expects embed object matching discord.js EmbedBuilder shape (partial allowed)

    const sent = await channel.send(sendOptions);
    return res.json({ status: 'ok', messageId: sent.id, content: content || null });
  } catch (err) {
    console.error('/send error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// catch-all for POST /
app.post('/', (req, res) => res.status(404).json({ error: 'Use /send' }));

// global error handlers to avoid crash
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});

// start http server
const server = app.listen(PORT, () => {
  console.log(`🚀 HTTP server listening on port ${PORT}`);
});

// start discord client
client.login(DISCORD_TOKEN).catch(err => {
  console.error('Discord login failed:', err);
  process.exit(1);
});