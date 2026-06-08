require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { initDatabase, all } = require('./database');
const { handleSectionCommand } = require('./commands/section');
const { handleAddCommand } = require('./commands/add');
const { handleShowCommand } = require('./commands/show');
const { handleTagCommand } = require('./commands/tag');
const { handleSearchCommand } = require('./commands/search');
const { handleAutoReactCommand } = require('./commands/autoReact');
const { handleSaveCommand } = require('./commands/save');
const { handleUseCommand } = require('./commands/use');
const { handleAliasCommand } = require('./commands/alias');
const { handleStatsCommand } = require('./commands/stats');
const { handleHelpCommand } = require('./commands/help');
const { handleEditCommand } = require('./commands/edit');
const { handleDeleteCommand } = require('./commands/delete');
const { handleCopyCommand } = require('./commands/copy');
const { handleMoveCommand } = require('./commands/move');
const { handleRandomCommand } = require('./commands/random');
const { handleRecentCommand } = require('./commands/recent');
const { handlePopularCommand } = require('./commands/popular');
const { handleTrendingCommand } = require('./commands/trending');
const { handleFavoriteCommand } = require('./commands/favorite');
const { handleArchiveCommand } = require('./commands/archive');
const { handleTemplateCommand } = require('./commands/template');
const { handlePingCommand } = require('./commands/ping');
const { handleInfoCommand } = require('./commands/info');
const { handleBackupCommand } = require('./commands/backup');
const { handleExportCommand } = require('./commands/export');
const { handleImportCommand } = require('./commands/import');
const { handlePermissionsCommand } = require('./commands/permissions');
const { handleCooldownCommand } = require('./commands/cooldown');
const { handleClearCommand } = require('./commands/clear');
const { handleVirusCheckCommand } = require('./commands/viruscheck');
const { isSpamming } = require('./utils/spamDetection');

// Initialize database
initDatabase();

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('clientReady', () => {
  console.log(`LoreBot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Skip bot messages unless it's the test bot (for automated testing)
  if (message.author.bot && message.author.id !== '1513506654635819133') return;

  // Check for spam (skip test bot)
  if (message.author.id !== '1513506654635819133' && isSpamming(message.author.id)) {
    await message.reply('[⚠️] Please slow down! You\'re sending messages too quickly.');
    return;
  }

  // Auto-reactions: check for keywords
  try {
    const reactions = await all('SELECT emoji, keyword FROM auto_reactions WHERE guild_id = ?', [message.guild.id]);
    const messageContent = message.content.toLowerCase();
    for (const reaction of reactions) {
      if (messageContent.includes(reaction.keyword.toLowerCase())) {
        await message.react(reaction.emoji).catch(() => {});
      }
    }
  } catch (error) {
    // Ignore auto-reaction errors
  }

  const content = message.content.trim();
  const prefix = '!';

  if (!content.startsWith(prefix)) return;

  const args = content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case 'section':
        await handleSectionCommand(message, args);
        break;
      case 'add':
        await handleAddCommand(message, args);
        break;
      case 'show':
        await handleShowCommand(message, args);
        break;
      case 'tag':
        await handleTagCommand(message, args);
        break;
      case 'search':
        await handleSearchCommand(message, args);
        break;
      case 'autoreact':
        await handleAutoReactCommand(message, args);
        break;
      case 'save':
        await handleSaveCommand(message, args);
        break;
      case 'use':
        await handleUseCommand(message, args);
        break;
      case 'alias':
        await handleAliasCommand(message, args);
        break;
      case 'stats':
        await handleStatsCommand(message, args);
        break;
      case 'help':
        await handleHelpCommand(message, args);
        break;
      case 'edit':
        await handleEditCommand(message, args);
        break;
      case 'delete':
        await handleDeleteCommand(message, args);
        break;
      case 'copy':
        await handleCopyCommand(message, args);
        break;
      case 'move':
        await handleMoveCommand(message, args);
        break;
      case 'random':
        await handleRandomCommand(message, args);
        break;
      case 'recent':
        await handleRecentCommand(message, args);
        break;
      case 'popular':
        await handlePopularCommand(message, args);
        break;
      case 'trending':
        await handleTrendingCommand(message, args);
        break;
      case 'favorite':
        await handleFavoriteCommand(message, args);
        break;
      case 'archive':
        await handleArchiveCommand(message, args);
        break;
      case 'template':
        await handleTemplateCommand(message, args);
        break;
      case 'ping':
        await handlePingCommand(message);
        break;
      case 'info':
        await handleInfoCommand(message);
        break;
      case 'backup':
        await handleBackupCommand(message);
        break;
      case 'export':
        await handleExportCommand(message, args);
        break;
      case 'import':
        await handleImportCommand(message, args);
        break;
      case 'permissions':
        await handlePermissionsCommand(message, args);
        break;
      case 'cooldown':
        await handleCooldownCommand(message, args);
        break;
      case 'clear':
        await handleClearCommand(message, args);
        break;
      case 'viruscheck':
        await handleVirusCheckCommand(message, args);
        break;
      default:
        // Unknown command
        break;
    }
  } catch (error) {
    console.error('Error executing command:', error);
    console.error('Command:', command);
    console.error('Error details:', error.message);
    await message.reply('[X] Error executing command.');
  }
});

client.login(process.env.DISCORD_TOKEN);
