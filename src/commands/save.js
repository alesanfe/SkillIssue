const { run, get } = require('../database');

async function handleSaveCommand(message, args) {
  const guildId = message.guild.id;
  const messageId = args[0];
  const sectionName = args.find(arg => arg.startsWith('--section='))?.split('=')[1];

  if (!messageId) {
    await message.reply('[X] Usage: !save <message_id> [--section=section_name]');
    return;
  }

  try {
    // Fetch the message from Discord
    const targetMessage = await message.channel.messages.fetch(messageId);

    if (!targetMessage) {
      await message.reply('[X] Message not found.');
      return;
    }

    // Get section ID if provided
    let sectionId = null;
    if (sectionName) {
      const section = await get('SELECT id FROM sections WHERE guild_id = ? AND name = ?', [guildId, sectionName]);
      if (section) {
        sectionId = section.id;
      } else {
        await message.reply(`[X] Section "${sectionName}" does not exist.`);
        return;
      }
    }

    // Save the message
    await run(
      'INSERT INTO saved_messages (section_id, message_id, author_id, content, channel_id) VALUES (?, ?, ?, ?, ?)',
      [sectionId, messageId, targetMessage.author.id, targetMessage.content, targetMessage.channel.id]
    );

    let response = `[OK] Message saved successfully`;
    if (sectionName) {
      response += ` in section "${sectionName}"`;
    }
    response += '.';

    await message.reply(response);
  } catch (error) {
    console.error('Error saving message:', error);
    await message.reply('[X] Error saving message. Make sure the ID is correct and in this channel.');
  }
}

module.exports = { handleSaveCommand };
