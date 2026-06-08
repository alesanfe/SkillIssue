const { inlineCode } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function handleBackupCommand(message) {
  try {
    const dbPath = path.join(__dirname, '..', '..', 'lorebot.db');
    const filename = `backup_${Date.now()}.db`;
    fs.copyFileSync(dbPath, path.join(__dirname, '..', '..', filename));

    await message.reply(`✅ Backup created: ${inlineCode(filename)}`);
  } catch (error) {
    console.error('Error creating backup:', error);
    await message.reply('❌ Error creating backup.');
  }
}

module.exports = { handleBackupCommand };
