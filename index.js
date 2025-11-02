
require('dotenv').config();

const http = require('http');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const APPLICATION_ID = process.env.APPLICATION_ID; // Discord Application (client) ID
const GUILD_ID = process.env.GUILD_ID; // Optional: dev/test guild for fast command registration

if (!TOKEN) {
  console.error('❌ Missing DISCORD_TOKEN env var.');
  process.exit(1);
}
if (!APPLICATION_ID) {
  console.error('❌ Missing APPLICATION_ID env var.');
  process.exit(1);
}

// Tiny HTTP server so Render Web Service stays healthy
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running.\n');
}).listen(PORT, () => console.log(`HTTP keepalive on port ${PORT}`));

// Create client with basic intents (no Message Content needed for slash commands)
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Define commands (guild or global)
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Répond Pong!'),
].map(cmd => cmd.toJSON());

// Register slash commands
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID),
        { body: commands }
      );
      console.log('✅ Guild commands registered.');
    } else {
      await rest.put(
        Routes.applicationCommands(APPLICATION_ID),
        { body: commands }
      );
      console.log('✅ Global commands registered (peuvent prendre jusqu’à 1h à apparaître).');
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

client.once('ready', () => {
  console.log(`🤖 Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'ping') {
      await interaction.reply('🏓 Pong!');
    }
  } catch (err) {
    console.error('Interaction error:', err);
  }
});

(async () => {
  await registerCommands();
  await client.login(TOKEN);
})();
