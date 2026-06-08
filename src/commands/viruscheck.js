const https = require('https');
const { inlineCode } = require('discord.js');

async function handleVirusCheckCommand(message, args) {
  const url = args[0];

  if (!url) {
    await message.reply(`❌ Usage: ${inlineCode('!viruscheck <url>')}`);
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    await message.reply(`❌ Invalid URL format: ${inlineCode(url)}`);
    return;
  }

  // Send scanning status
  const scanningEmbed = new EmbedBuilder()
    .setTitle('🔍 Scanning URL...')
    .setColor('#FFA500')
    .setDescription(`Checking: ${url.length > 80 ? url.substring(0, 80) + '...' : url}`)
    .setFooter({ text: 'Powered by VirusTotal' })
    .setTimestamp();

  const scanMsg = await message.reply({ embeds: [scanningEmbed] });

  // Check if VirusTotal API key is configured
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  
  if (!apiKey) {
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Virus Check Error')
      .setColor('#ED4245')
      .setDescription(`VirusTotal API key not configured.\nSet ${inlineCode('VIRUSTOTAL_API_KEY')} environment variable.`)
      .addFields({ name: '🔑 Setup', value: hyperlink('Get a free API key at virustotal.com', 'https://www.virustotal.com/'), inline: false })
      .setTimestamp()
      .setFooter({ text: 'Powered by VirusTotal' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Get API Key').setURL('https://www.virustotal.com/gui/join-us').setStyle(ButtonStyle.Link)
    );
    await scanMsg.edit({ embeds: [errorEmbed], components: [row] });
    return;
  }

  try {
    // Submit URL for scanning
    const scanResult = await submitUrlToVirusTotal(url, apiKey);
    
    if (scanResult.error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Virus Check Error')
        .setColor('#ED4245')
        .setDescription(scanResult.error)
        .setTimestamp()
        .setFooter({ text: 'Powered by VirusTotal' });
      
      await scanMsg.edit({ embeds: [errorEmbed] });
      return;
    }

    // Get scan report
    const report = await getScanReport(scanResult.data.id, apiKey);
    
    if (report.error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Virus Check Error')
        .setColor('#ED4245')
        .setDescription(report.error)
        .setTimestamp()
        .setFooter({ text: 'Powered by VirusTotal' });
      
      await scanMsg.edit({ embeds: [errorEmbed] });
      return;
    }

    // Parse results
    const stats = report.data.attributes.last_analysis_stats;
    const maliciousCount = stats.malicious + stats.suspicious;
    const isSafe = maliciousCount === 0;

    // Send simple verdict message and react
    const verdict = isSafe ? 'Safe' : 'Dangerous';
    await scanMsg.edit({ content: `🔍 VirusTotal: ${verdict}`, embeds: [], components: [] });
    await message.react(isSafe ? '✅' : '❌');

  } catch (error) {
    console.error('Error in virus check:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Virus Check Error')
      .setColor('#ED4245')
      .setDescription('An unexpected error occurred while scanning the URL.')
      .setTimestamp()
      .setFooter({ text: 'Powered by VirusTotal' });
    
    await scanMsg.edit({ embeds: [errorEmbed] });
  }
}

function submitUrlToVirusTotal(url, apiKey) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ url });
    
    const options = {
      hostname: 'www.virustotal.com',
      path: '/api/v3/urls',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-apikey': apiKey,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({ data: response.data });
          } else {
            resolve({ error: response.error?.message || 'API request failed' });
          }
        } catch {
          resolve({ error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', () => resolve({ error: 'Network error' }));
    req.write(data);
    req.end();
  });
}

function getScanReport(analysisId, apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.virustotal.com',
      path: `/api/v3/analyses/${analysisId}`,
      method: 'GET',
      headers: {
        'x-apikey': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            resolve({ error: response.error?.message || 'Failed to get report' });
          }
        } catch {
          resolve({ error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', () => resolve({ error: 'Network error' }));
    req.end();
  });
}

module.exports = { handleVirusCheckCommand };
