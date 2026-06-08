const commandDetails = {
  'add': {
    name: '!add',
    description: 'Add a new entry to the database',
    usage: '!add <section> <name> "<content>" [--img <url>] [--gif <url>] [--video <url>]',
    examples: [
      '!add memes juan "Juan came back with his ex"',
      '!add memes funny "A funny meme" --img https://example.com/meme.jpg'
    ]
  },
  'show': {
    name: '!show',
    description: 'Display an entry by name or alias',
    usage: '!show <name>',
    examples: ['!show juan', '!show exjuan']
  },
  'edit': {
    name: '!edit',
    description: 'Edit an existing entry',
    usage: '!edit <name> "<new content>"',
    examples: ['!edit juan "Juan came back with his ex AGAIN"']
  },
  'delete': {
    name: '!delete',
    description: 'Delete an entry (requires confirmation)',
    usage: '!delete <name>',
    examples: ['!delete juan']
  },
  'search': {
    name: '!search',
    description: 'Search for entries by name, content, or tags',
    usage: '!search <term>',
    examples: ['!search juan', '!search cringe']
  },
  'save': {
    name: '!save',
    description: 'Save a message as an entry',
    usage: '!save <message_id>',
    examples: ['!save 123456789']
  },
  'section': {
    name: '!section',
    description: 'Manage sections (create, delete, list, view)',
    usage: '!section <action> [args]',
    examples: [
      '!section create memes "Funny memes"',
      '!section list',
      '!section view memes',
      '!section delete memes'
    ]
  },
  'tag': {
    name: '!tag',
    description: 'Add tags to entries for easier searching',
    usage: '!tag <entry> <tag>',
    examples: ['!tag juan cringe', '!tag juan funny']
  },
  'alias': {
    name: '!alias',
    description: 'Create an alias for an entry',
    usage: '!alias <name> <alias>',
    examples: ['!alias juan exjuan']
  },
  'copy': {
    name: '!copy',
    description: 'Copy an entry to another section',
    usage: '!copy <name> <section>',
    examples: ['!copy juan archive']
  },
  'move': {
    name: '!move',
    description: 'Move an entry to another section',
    usage: '!move <name> <section>',
    examples: ['!move juan archive']
  },
  'random': {
    name: '!random',
    description: 'Get a random entry',
    usage: '!random [section]',
    examples: ['!random', '!random memes']
  },
  'recent': {
    name: '!recent',
    description: 'Show recently added entries',
    usage: '!recent [limit]',
    examples: ['!recent', '!recent 10']
  },
  'popular': {
    name: '!popular',
    description: 'Show most used entries',
    usage: '!popular [limit]',
    examples: ['!popular', '!popular 5']
  },
  'trending': {
    name: '!trending',
    description: 'Show trending entries (most used in 7 days)',
    usage: '!trending [limit]',
    examples: ['!trending', '!trending 5']
  },
  'favorite': {
    name: '!favorite',
    description: 'Mark or unmark an entry as favorite',
    usage: '!favorite <name>',
    examples: ['!favorite juan']
  },
  'archive': {
    name: '!archive',
    description: 'Archive or unarchive an entry',
    usage: '!archive <name>',
    examples: ['!archive juan']
  },
  'template': {
    name: '!template',
    description: 'Manage entry templates',
    usage: '!template <action> [args]',
    examples: [
      '!template create mytemplate "Template content {var}"',
      '!template list',
      '!template use mytemplate --var value',
      '!template delete mytemplate'
    ]
  },
  'autoreact': {
    name: '!autoreact',
    description: 'Configure auto-reactions for keywords in messages',
    usage: '!autoreact <add|list|remove> [args]',
    examples: [
      '!autoreact add 💀 cringe',
      '!autoreact list',
      '!autoreact remove 💀 cringe'
    ]
  },
  'use': {
    name: '!use',
    description: 'Use an entry (increments use count and shows content)',
    usage: '!use <name>',
    examples: ['!use juan']
  },
  'stats': {
    name: '!stats',
    description: 'Show bot statistics',
    usage: '!stats',
    examples: ['!stats']
  },
  'info': {
    name: '!info',
    description: 'Show server and bot information',
    usage: '!info',
    examples: ['!info']
  },
  'ping': {
    name: '!ping',
    description: 'Check bot latency',
    usage: '!ping',
    examples: ['!ping']
  },
  'backup': {
    name: '!backup',
    description: 'Create a database backup',
    usage: '!backup',
    examples: ['!backup']
  },
  'export': {
    name: '!export',
    description: 'Export database to JSON',
    usage: '!export',
    examples: ['!export']
  },
  'import': {
    name: '!import',
    description: 'Import database from JSON',
    usage: '!import <file>',
    examples: ['!import backup.json']
  },
  'clear': {
    name: '!clear',
    description: 'Clear messages in a channel',
    usage: '!clear <count>',
    examples: ['!clear 10']
  },
  'viruscheck': {
    name: '!viruscheck',
    description: 'Check if a URL is safe using VirusTotal',
    usage: '!viruscheck <url>',
    examples: ['!viruscheck https://google.com']
  },
  'permissions': {
    name: '!permissions',
    description: 'Manage command permissions',
    usage: '!permissions <action> [args]',
    examples: [
      '!permissions allow @user !add',
      '!permissions deny @role !delete',
      '!permissions list'
    ]
  },
  'cooldown': {
    name: '!cooldown',
    description: 'Manage command cooldowns',
    usage: '!cooldown <action> [args]',
    examples: [
      '!cooldown set !add 60',
      '!cooldown list',
      '!cooldown remove !add'
    ]
  }
};

async function handleHelpCommand(message, args) {
  const { EmbedBuilder, bold, codeBlock, italic } = require('discord.js');
  
  const commandName = args[0]?.toLowerCase();

  if (commandName && commandDetails[commandName]) {
    const cmd = commandDetails[commandName];
    const embed = new EmbedBuilder()
      .setTitle(`📖 Help: ${cmd.name}`)
      .setColor('#5865F2')
      .setDescription(cmd.description)
      .addFields(
        { name: '📝 Usage', value: codeBlock(cmd.usage), inline: false },
        { name: '💡 Examples', value: cmd.examples.map(ex => codeBlock(ex)).join('\n'), inline: false }
      )
      .setTimestamp()
      .setAuthor({ 
        name: 'LoreBot', 
        iconURL: message.client.user?.displayAvatarURL() 
      })
      .setFooter({ 
        text: `Requested by ${message.author.tag} • Use !help for all commands`,
        iconURL: message.author.displayAvatarURL()
      });

    await message.reply({ embeds: [embed] });
    return;
  }

  if (commandName) {
    await message.reply(`❌ Unknown command: ${codeBlock(commandName)}. Use ${codeBlock('!help')} to see all commands.`);
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('📚 LoreBot Commands')
    .setColor('#5865F2')
    .setDescription(`Available commands for LoreBot. Use ${codeBlock('!help <command>')} for detailed info.`)
    .setTimestamp()
    .setAuthor({ 
      name: 'LoreBot', 
      iconURL: message.client.user?.displayAvatarURL() 
    })
    .setFooter({ 
      text: `Requested by ${message.author.tag}`,
      iconURL: message.author.displayAvatarURL()
    })
    .addFields(
      { name: '📁 Sections', value: codeBlock('!section create/delete/list/view'), inline: true },
      { name: '📝 Messages', value: codeBlock('!add/show/edit/delete/copy/move'), inline: true },
      { name: '🏷️ Tags', value: codeBlock('!tag'), inline: true },
      { name: '🔍 Search', value: codeBlock('!search'), inline: true },
      { name: '🎲 Discovery', value: codeBlock('!random/recent/popular/trending'), inline: true },
      { name: '⭐ Organization', value: codeBlock('!favorite/archive/template'), inline: true },
      { name: '😀 Auto-reactions', value: codeBlock('!autoreact'), inline: true },
      { name: '💾 Save Messages', value: codeBlock('!save'), inline: true },
      { name: '🔧 Templates', value: codeBlock('!template'), inline: true },
      { name: '🔗 Aliases', value: codeBlock('!alias'), inline: true },
      { name: '📊 Statistics', value: codeBlock('!stats/info'), inline: true },
      { name: '⚡ Utilities', value: codeBlock('!ping/backup/export/import/clear/viruscheck'), inline: true },
      { name: '🛡️ Administration', value: codeBlock('!permissions/cooldown'), inline: true }
    );

  await message.reply({ embeds: [embed] });
}

module.exports = { handleHelpCommand };
