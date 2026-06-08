const { run, get, all } = require('../database');
const { time, MessageFlags, ContainerBuilder, inlineCode, italic, TimestampStyles } = require('discord.js');

async function handleUseCommand(message, args) {
  const name = args[0];

  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!use <name> [--user value] [--enemy value]')}`);
    return;
  }

  // Parse variables
  const variables = {};
  for (let i = 1; i < args.length; i++) {
    const match = args[i].match(/--(\w+)=(.+)/);
    if (match) {
      variables[match[1]] = match[2];
    }
  }

  try {
    // Find the entry
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    // Increment use count
    await run('UPDATE entries SET uses = uses + 1 WHERE id = ?', [entry.id]);

    // Replace variables in content
    let content = entry.content || '';

    // Replace template variables
    content = content.replace(/{user}/g, variables.user || '{user}');
    content = content.replace(/{enemy}/g, variables.enemy || '{enemy}');
    content = content.replace(/{game}/g, variables.game || '{game}');
    content = content.replace(/{count}/g, variables.count || '{count}');
    content = content.replace(/{channel}/g, variables.channel || '{channel}');

    // Get attachments
    const attachments = await all('SELECT type, url FROM attachments WHERE entry_id = ?', [entry.id]);

    // Get section name for display
    const section = await get('SELECT name FROM sections WHERE id = ?', [entry.section_id]);

    const imageUrls = attachments.filter(a => a.type === 'image').map(a => a.url);
    const gifUrls = attachments.filter(a => a.type === 'gif').map(a => a.url);
    const videoUrls = attachments.filter(a => a.type === 'video').map(a => a.url);
    const allMedia = [...imageUrls, ...gifUrls];

    const container = new ContainerBuilder().setAccentColor(0x5865F2);
    const titleLine = `📄 **${entry.name}**${section ? ` · ${italic(section.name)}` : ''}`;
    const metaLine = [
      entry.created_at ? `🕐 ${time(new Date(entry.created_at), TimestampStyles.RelativeTime)}` : null,
      `📊 ${inlineCode(entry.uses + ' uses')}`,
    ].filter(Boolean).join(' · ');

    if (allMedia.length === 1) {
      container.addSectionComponents((sec) =>
        sec
          .addTextDisplayComponents(
            (t) => t.setContent(titleLine),
            (t) => t.setContent(content || italic('No content')),
            (t) => t.setContent(metaLine)
          )
          .setThumbnailAccessory((thumb) => thumb.setURL(allMedia[0]))
      );
    } else {
      container.addTextDisplayComponents((t) => t.setContent(titleLine));
      if (content) {
        container.addSeparatorComponents((s) => s);
        container.addTextDisplayComponents((t) => t.setContent(content));
      }
      if (allMedia.length >= 2) {
        container.addSeparatorComponents((s) => s);
        container.addMediaGalleryComponents((g) =>
          allMedia.reduce((acc, url) => acc.addItems((item) => item.setURL(url)), g)
        );
      }
      container.addSeparatorComponents((s) => s);
      container.addTextDisplayComponents((t) => t.setContent(metaLine));
    }

    if (videoUrls.length > 0) {
      container.addSeparatorComponents((s) => s);
      container.addTextDisplayComponents((t) => t.setContent(`🎥 **Videos:**\n${videoUrls.join('\n')}`));
    }

    await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch (error) {
    console.error('Error in use command:', error);
    throw error;
  }
}

module.exports = { handleUseCommand };
