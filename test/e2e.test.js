require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const CHANNEL_ID = '913024119329669146';
const BOT_ID = '1513506654635819133';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const tests = [
  // Basic Commands
  {
    name: 'Help command',
    command: '!help',
    expectedKeywords: ['LoreBot', 'Commands'],
  },
  {
    name: 'Help with specific command',
    command: '!help add',
    expectedKeywords: ['Usage', 'Examples', 'add'],
  },
  {
    name: 'Ping command',
    command: '!ping',
    expectedKeywords: ['Measuring'],
  },
  {
    name: 'Info command',
    command: '!info',
    expectedKeywords: ['Info', 'Server'],
  },

  // Section Commands
  {
    name: 'Section create',
    command: '!section create testmemes Test memes section',
    expectedKeywords: ['created', 'testmemes'],
  },
  {
    name: 'Section list',
    command: '!section list',
    expectedKeywords: ['Sections', 'testmemes'],
  },
  {
    name: 'Section view',
    command: '!section view testmemes',
    expectedKeywords: ['empty', 'testmemes'],
  },

  // Message Commands
  {
    name: 'Add message',
    command: '!add testmemes juan "Juan came back with his ex"',
    expectedKeywords: ['saved', 'juan'],
  },
  {
    name: 'Add message with image',
    command: '!add testmemes imgtest "Image test" --img https://preview.redd.it/i-need-broly-stuff-images-gifs-memes-anything-idk-what-to-v0-eomrc7k9tste1.jpeg?width=1170&format=pjpg&auto=webp&s=7da4f463271a6f8f142b7e010f17c4def11a724c',
    expectedKeywords: ['saved', 'imgtest'],
  },
  {
    name: 'Add message with GIF',
    command: '!add testmemes giftest "GIF test" --gif https://media3.giphy.com/media/H5C8CevNMbpBqNqFjl/giphy.gif',
    expectedKeywords: ['saved', 'giftest'],
  },
  {
    name: 'Add message with video',
    command: '!add testmemes vidtest "Video test" --video https://example.com/video.mp4',
    expectedKeywords: ['saved', 'vidtest'],
  },
  {
    name: 'Add message with multiple images',
    command: '!add testmemes multiimg "Multi image" --img https://preview.redd.it/i-need-broly-stuff-images-gifs-memes-anything-idk-what-to-v0-eomrc7k9tste1.jpeg?width=1170&format=pjpg&auto=webp&s=7da4f463271a6f8f142b7e010f17c4def11a724c,https://media3.giphy.com/media/H5C8CevNMbpBqNqFjl/giphy.gif',
    expectedKeywords: ['saved', 'multiimg'],
  },
  {
    name: 'Add message with long text',
    command: '!add testmemes longtest "' + 'a'.repeat(200) + '"',
    expectedKeywords: ['saved', 'longtest'],
  },
  {
    name: 'Add message with emojis',
    command: '!add testmemes emoji "test 😂 👍 💀"',
    expectedKeywords: ['saved', 'emoji'],
  },
  {
    name: 'Edit message',
    command: '!edit juan "Juan came back with his ex AGAIN"',
    expectedKeywords: ['updated', 'juan'],
  },
  {
    name: 'Create second section for copy',
    command: '!section create testarchive Archive section',
    expectedKeywords: ['created', 'testarchive'],
  },
  {
    name: 'Copy message',
    command: '!copy juan testarchive',
    expectedKeywords: ['copied', 'juan'],
  },
  {
    name: 'Create third section for move',
    command: '!section create testmoved Moved section',
    expectedKeywords: ['created', 'testmoved'],
  },
  {
    name: 'Move message (skip - copy already in different section)',
    command: '!move juan testarchive',
    expectedKeywords: ['already', 'exists'],
  },

  // Tag Commands
  {
    name: 'Add tag',
    command: '!tag juan cringe',
    expectedKeywords: ['Tag', 'juan'],
  },
  {
    name: 'Add second tag',
    command: '!tag juan funny',
    expectedKeywords: ['Tag', 'juan'],
  },
  {
    name: 'Add tag with long text',
    command: '!tag juan ' + 'a'.repeat(50),
    expectedKeywords: ['Tag', 'juan'],
  },
  {
    name: 'Search by tag',
    command: '!tag search cringe',
    expectedKeywords: ['Tag', 'cringe'],
  },

  // Search Commands
  {
    name: 'Search by term',
    command: '!search juan',
    expectedKeywords: ['Search', 'juan'],
  },
  {
    name: 'Search with no results',
    command: '!search nonexistent123',
    expectedKeywords: ['No results'],
  },
  {
    name: 'Search partial match',
    command: '!search ju',
    expectedKeywords: ['Search', 'ju'],
  },

  // Discovery Commands
  {
    name: 'Popular entries',
    command: '!popular',
    expectedKeywords: ['Popular', 'Entries'],
    acceptNoResults: true,
  },
  {
    name: 'Trending entries',
    command: '!trending',
    expectedKeywords: ['Trending'],
    acceptNoResults: true,
  },

  // Organization Commands
  {
    name: 'Favorite entry',
    command: '!favorite juan',
    expectedKeywords: ['favorites', 'juan'],
  },
  {
    name: 'Pin entry',
    command: '!pin juan',
    expectedKeywords: ['Pinned', 'juan'],
  },
  {
    name: 'Archive entry',
    command: '!archive juan',
    expectedKeywords: ['Archived', 'juan'],
  },

  // Template Commands
  {
    name: 'Template create',
    command: '!template create welcome "Welcome {user} to {channel}"',
    expectedKeywords: ['Template', 'welcome'],
  },
  {
    name: 'Template list',
    command: '!template list',
    expectedKeywords: ['Templates', 'welcome'],
  },
  {
    name: 'Template use',
    command: '!template use welcome user=Alex channel=general',
    expectedKeywords: ['Welcome', 'Alex', 'general'],
  },
  {
    name: 'Template delete',
    command: '!template delete welcome',
    expectedKeywords: ['Template', 'deleted'],
  },

  // Variable Commands
  {
    name: 'Set variable',
    command: '!setvar server_name "Test Server"',
    expectedKeywords: ['Variable', 'server_name'],
  },
  {
    name: 'List variables',
    command: '!listvar',
    expectedKeywords: ['Variables', 'server_name'],
  },

  // Alias Commands
  {
    name: 'Create alias',
    command: '!alias juan exjuan',
    expectedKeywords: ['Alias', 'juan'],
  },
  {
    name: 'Create second alias',
    command: '!alias juan exjuan2',
    expectedKeywords: ['Alias', 'juan'],
  },

  // Auto-reaction Commands
  {
    name: 'Auto-react configure',
    command: '!autoreact 💀 5',
    expectedKeywords: ['Auto-reaction', 'updated'],
  },
  {
    name: 'Auto-react update',
    command: '!autoreact 💀 10',
    expectedKeywords: ['Auto-reaction', 'updated'],
  },
  {
    name: 'Set reaction',
    command: '!reaction juan 💀',
    expectedKeywords: ['reaction', 'juan'],
  },
  {
    name: 'Stats command',
    command: '!stats',
    expectedKeywords: ['Statistics', 'Messages'],
  },

  // Utility Commands
  {
    name: 'Backup command',
    command: '!backup',
    expectedKeywords: ['Backup', 'created'],
  },
  {
    name: 'Export command',
    command: '!export',
    expectedKeywords: ['Exported', 'entries'],
  },

  // Administration Commands
  {
    name: 'Permissions allow',
    command: '!permissions allow role1 add',
    expectedKeywords: ['Allowed', 'role', 'add'],
  },
  {
    name: 'Permissions deny',
    command: '!permissions deny role2 delete',
    expectedKeywords: ['Denied', 'delete'],
  },
  {
    name: 'Permissions list',
    command: '!permissions list',
    expectedKeywords: ['permissions'],
    acceptNoResults: true,
  },
  {
    name: 'Cooldown set',
    command: '!cooldown set add 30',
    expectedKeywords: ['Cooldown', 'add'],
  },
  {
    name: 'Cooldown list',
    command: '!cooldown list',
    expectedKeywords: ['cooldown'],
    acceptNoResults: true,
  },
  {
    name: 'Cooldown remove',
    command: '!cooldown remove add',
    expectedKeywords: ['Removed', 'add'],
  },

  // Cleanup
  {
    name: 'Delete third section',
    command: '!section delete testmoved',
    expectedKeywords: ['deleted', 'testmoved'],
  },
  {
    name: 'Delete second section',
    command: '!section delete testarchive',
    expectedKeywords: ['deleted', 'testarchive'],
  },
  {
    name: 'Delete multiple messages',
    command: '!delete juan',
    expectedKeywords: ['delete', 'juan'],
  },
  {
    name: 'Delete imgtest',
    command: '!delete imgtest',
    expectedKeywords: ['delete', 'imgtest'],
  },
  {
    name: 'Delete giftest',
    command: '!delete giftest',
    expectedKeywords: ['delete', 'giftest'],
  },
  {
    name: 'Delete vidtest',
    command: '!delete vidtest',
    expectedKeywords: ['delete', 'vidtest'],
  },
  {
    name: 'Delete multiimg',
    command: '!delete multiimg',
    expectedKeywords: ['delete', 'multiimg'],
  },
  {
    name: 'Delete longtest',
    command: '!delete longtest',
    expectedKeywords: ['delete', 'longtest'],
  },
  {
    name: 'Delete emoji',
    command: '!delete emoji',
    expectedKeywords: ['delete', 'emoji'],
  },
  {
    name: 'Delete section',
    command: '!section delete testmemes',
    expectedKeywords: ['deleted'],
  },
  {
    name: 'Add modal prompt',
    command: '!add',
    expectedKeywords: ['Click', 'open', 'form'],
  },
  {
    name: 'Edit modal prompt',
    command: '!edit juan',
    expectedKeywords: ['Edit', 'juan'],
  },
  {
    name: 'Delete confirm prompt',
    command: '!delete juan',
    expectedKeywords: ['delete', 'juan'],
  },
  {
    name: 'Random command',
    command: '!random',
    expectedKeywords: ['Random'],
    acceptNoResults: true,
  },
  {
    name: 'Recent command',
    command: '!recent',
    expectedKeywords: ['Recent'],
    acceptNoResults: true,
  },
];

let currentTest = 0;
let testResults = [];

client.once('clientReady', async () => {
  console.log('Test client connected');
  console.log(`Starting ${tests.length} automated Discord tests...\n`);
  
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      console.error('Channel not found');
      process.exit(1);
    }
    
    runNextTest(channel);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});

async function runNextTest(channel) {
  if (currentTest >= tests.length) {
    printResults();
    client.destroy();
    process.exit(0);
  }
  
  const test = tests[currentTest];
  console.log(`[${currentTest + 1}/${tests.length}] ${test.name}`);
  
  try {
    const message = await channel.send(test.command);
    
    const testTimeout = test.timeout || 10000;
    let settled = false;

    function extractText(botMessage) {
      const embedText = (botMessage.embeds || []).map(e => [
        e.title || '',
        e.description || '',
        ...(e.fields || []).map(f => f.name + ' ' + f.value),
        e.footer?.text || '',
      ].join(' ')).join(' ');
      return (botMessage.content || '') + ' ' + embedText;
    }

    function evaluateMessage(botMessage) {
      if (settled) return;
      const content = extractText(botMessage);
      const passed = test.acceptNoResults
        ? test.expectedKeywords.some(k => content.toLowerCase().includes(k.toLowerCase()))
        : test.expectedKeywords.every(k => content.toLowerCase().includes(k.toLowerCase()));
      // For scan-based commands, skip the intermediate 'Scanning...' message
      if (!passed && content.toLowerCase().includes('scanning')) return;
      settled = true;
      testResults.push({ name: test.name, passed, response: content.substring(0, 100) + '...' });
      console.log(`  ${passed ? '[OK]' : '[X]'} ${test.name}`);
      if (!passed) {
        console.log(`    Expected: ${test.expectedKeywords.join(', ')}`);
        console.log(`    Got: ${content.substring(0, 150)}`);
      }
      currentTest++;
      setTimeout(() => runNextTest(channel), 1500);
    }

    const collector = channel.createMessageCollector({
      filter: m => m.author.id === BOT_ID && m.createdTimestamp > message.createdTimestamp,
      time: testTimeout,
    });

    // Also listen for message edits (viruscheck edits the initial scanning embed)
    const editHandler = (oldMsg, newMsg) => {
      if (newMsg.author?.id === BOT_ID && newMsg.createdTimestamp > message.createdTimestamp) {
        evaluateMessage(newMsg);
      }
    };
    client.on('messageUpdate', editHandler);
    
    collector.on('collect', (botMessage) => {
      evaluateMessage(botMessage);
    });
    
    collector.on('end', (collected, reason) => {
      client.off('messageUpdate', editHandler);
      if (!settled) {
        testResults.push({ name: test.name, passed: false, response: 'No response (timeout)' });
        console.log(`  [X] ${test.name} - No response (timeout)`);
        currentTest++;
        setTimeout(() => runNextTest(channel), 1500);
      }
    });
  } catch (error) {
    console.error(`  [X] ${test.name} - Error:`, error.message);
    testResults.push({
      name: test.name,
      passed: false,
      response: 'Error: ' + error.message,
    });
    currentTest++;
    setTimeout(() => runNextTest(channel), 1500);
  }
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('Discord Test Results');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  
  const failedTests = testResults.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log('\nFailed tests:');
    failedTests.forEach(result => {
      console.log(`  [X] ${result.name}`);
      console.log(`      Response: ${result.response}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('[OK] All Discord tests passed!');
  } else {
    console.log(`[X] ${failed} test(s) failed.`);
  }
}

client.login(process.env.DISCORD_TOKEN);
