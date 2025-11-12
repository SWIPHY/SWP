// index.js
'use strict';

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json({ limit: '128kb' }));

// CONFIG via env
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;       // string like "123456789012345678"
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const PORT = parseInt(process.env.PORT || '3000', 10);

// basic checks
if (!DISCORD_TOKEN) {
  console.error('FATAL: DISCORD_TOKEN not set'); process.exit(1);
}
if (!CHANNEL_ID) {
  console.error('FATAL: CHANNEL_ID not set'); process.exit(1);
}

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`✅ Discord ready as ${client.user.tag} (id=${client.user.id})`);
});

client.on('error', (err) => console.error('Discord error:', err));

// health-check
app.get('/', (req, res) => {
  res.json({ status: 'ok', bot: client.user ? client.user.tag : 'connecting' });
});

// secret middleware
function checkSecret(req, res, next) {
  if (!WEBHOOK_SECRET) return next(); // if no secret set, allow (dev only)
  const auth = (req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return res.status(403).json({ error: 'Forbidden' });
  const token = auth.split(' ')[1];
  if (token !== WEBHOOK_SECRET) return res.status(403).json({ error: 'Forbidden' });
  return next();
}

// POST /send -> { content: "texte" } or { content:"", embed: {...} }
app.post('/send', checkSecret, async (req, res) => {
  try {
    const { content, embed } = req.body || {};
    if (!content && !embed) return res.status(400).json({ error: "Missing 'content' or 'embed'" });

    const channel = await client.channels.fetch(String(CHANNEL_ID)).catch(() => null);
    if (!channel || !channel.isTextBased()) return res.status(404).json({ error: 'Channel not found or not text' });

    const sendOptions = {};
    if (content) sendOptions.content = String(content);
    if (embed) sendOptions.embeds = [embed];

    const sent = await channel.send(sendOptions);
    return res.json({ status: 'ok', messageId: sent.id });
  } catch (err) {
    console.error('/send error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// avoid "Cannot POST /"
app.post('/', (req, res) => res.status(404).json({ error: 'Use /send' }));

// global handlers
process.on('uncaughtException', (err) => console.error('uncaughtException', err));
process.on('unhandledRejection', (reason) => console.error('unhandledRejection', reason));

// start server & discord
app.listen(PORT, () => console.log(`🚀 HTTP server listening on ${PORT}`));
client.login(DISCORD_TOKEN).catch(err => { console.error('Discord login failed:', err); process.exit(1); });