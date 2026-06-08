const { run, get, all } = require('../database');
const { EmbedBuilder, inlineCode, bold } = require('discord.js');

async function handleTagCommand(message, args) {
  const guildId = message.guild.id;
  const subcommand = args[0]?.toLowerCase();

  if (!subcommand) {
    await message.reply(`❌ Usage: ${inlineCode('!tag <name> <tag>')} or ${inlineCode('!tag search <tag>')}`);
    return;
  }

  switch (subcommand) {
    case 'add':
      await addTag(message, args, guildId);
      break;
    case 'search':
      await searchByTag(message, args, guildId);
      break;
    default:
      // If it's not a subcommand, treat it as adding a tag
      await addTag(message, args, guildId);
  }
}

async function addTag(message, args, guildId) {
  const name = args[0];
  const tag = args[1];

  if (!name || !tag) {
    await message.reply(`❌ Usage: ${inlineCode('!tag <name> <tag>')}`);
    return;
  }

  const entry = await get('SELECT id FROM entries WHERE name = ?', [name]);

  if (!entry) {
    await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
    return;
  }

  try {
    await run('INSERT INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, tag]);
    await message.reply(`✅ Tag ${inlineCode(tag)} added to ${bold(name)}.`);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      await message.reply(`❌ Tag ${inlineCode(tag)} already exists for ${inlineCode(name)}.`);
    } else {
      throw error;
    }
  }
}

async function searchByTag(message, args, guildId) {
  const tag = args[1] || args[0];

  if (!tag) {
    await message.reply(`❌ Usage: ${inlineCode('!tag search <tag>')}`);
    return;
  }

  const results = await all(`
    SELECT e.name, e.content, s.name as section_name
    FROM entries e
    JOIN tags t ON e.id = t.entry_id
    LEFT JOIN sections s ON e.section_id = s.id
    WHERE t.tag = ?
  `, [tag]);

  if (results.length === 0) {
    await message.reply(`❌ No entries found with tag ${inlineCode(tag)}.`);
    return;
  }

  const resultList = results
    .map(r => {
      const sectionPrefix = r.section_name ? `${r.section_name}.` : '';
      return `🏷️ ${bold(sectionPrefix + r.name)}: ${r.content?.substring(0, 60) || '(no content)'}${(r.content?.length || 0) > 60 ? '...' : ''}`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`🏷️ Tag: ${tag}`)
    .setColor('#5865F2')
    .setDescription(resultList)
    .setTimestamp()
    .setAuthor({ name: 'LoreBot', iconURL: message.client.user?.displayAvatarURL() })
    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

  await message.reply({ embeds: [embed] });
}

module.exports = { handleTagCommand };
