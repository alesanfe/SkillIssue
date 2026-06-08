async function handleClearCommand(message, args) {
  const limit = parseInt(args[0]) || 10;

  try {
    // Fetch bot messages in the channel
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(m => m.author.bot);

    let deleted = 0;
    for (const msg of botMessages.values()) {
      if (deleted >= limit) break;
      await msg.delete();
      deleted++;
    }

    await message.channel.send(`[CLEAN] Cleared ${deleted} bot messages.`);
  } catch (error) {
    console.error('Error clearing messages:', error);
    await message.channel.send('[X] Error clearing messages.');
  }
}

module.exports = { handleClearCommand };
