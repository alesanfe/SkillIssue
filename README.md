# LoreBot

A Discord bot for saving and organizing server lore, messages, and memes with advanced search and template features.

## Commands

For detailed command documentation, see [COMMANDS.md](COMMANDS.md).

### Sections

- `!section create <name> [description]` - Create a new section
- `!section delete <name>` - Delete a section
- `!section list` - List all sections
- `!section view <name>` - View section content

### Messages

- `!add [section] <name> "content" [--img url1,url2] [--gif url] [--video url]` - Save a message
- `!show <name>` - Show a message
- `!show <section>.<name>` - Show a message from a specific section
- `!edit <name> <new content>` - Edit existing content
- `!delete <name>` - Delete content
- `!copy <name> <target_section>` - Copy content to another section
- `!move <name> <target_section>` - Move content to another section

### Tags

- `!tag <message_name> <tag>` - Add a tag to a message
- `!tag search <tag>` - Search messages by tag

### Search

- `!search <term>` - Search messages by name, content, or tag

### Discovery

- `!random [section]` - Show a random entry
- `!recent [limit]` - Show recent entries
- `!popular [limit]` - Show most used entries
- `!trending [limit]` - Show trending entries (last 7 days)

### Organization

- `!favorite <name>` - Toggle favorite status
- `!pin <name>` - Toggle pin status
- `!archive <name>` - Toggle archive status
- `!template <create|use|list|delete>` - Manage templates

### Auto-reactions

- `!autoreact <emoji> <threshold>` - Configure auto-reaction for popular messages
- `!reaction <name> <emoji>` - Set reaction for entry
- `!react <name>` - React with configured emojis

### Save Discord Messages

- `!save <message_id> [--section=section_name]` - Save a real Discord message

### Variables

- `!use <name> [--user value] [--enemy value] [--game value] [--count value] [--channel value]` - Use a template with variables
- `!setvar <name> <value>` - Set global variable
- `!listvar` - List global variables

Supported variables:
- `{user}` - user
- `{enemy}` - rival
- `{game}` - game
- `{count}` - number
- `{channel}` - channel

### Aliases

- `!alias <message_name> <alias>` - Create an alias for a message

### Statistics

- `!stats` - View server statistics
- `!info` - Show bot/server info

### Utilities

- `!ping` - Check bot latency
- `!backup` - Create database backup
- `!export [section]` - Export entries to JSON
- `!import <filename>` - Import entries from JSON
- `!clear [limit]` - Clear bot messages

### Administration

- `!permissions <allow|deny|list> [role_id] [command]` - Manage permissions
- `!cooldown <set|remove|list> [command] [seconds]` - Manage cooldowns

### Help

- `!help` - Show all available commands

## 📌 Usage Examples

```
!section create memes
!add memes juan_ex "Juan came back with his ex"
!show memes.juan_ex
!add memes rata "Literally you" --img https://...
!tag juan_ex cringe
!search ex
!autoreact 💀 5
!save 13284712847 --section memes
!add defeat "{user} lost against {enemy}"
!use defeat --user Juan --enemy Pedro
!alias juan_ex exjuan
!stats
```

## 🛠️ Technologies

- Node.js
- discord.js
- SQLite (sqlite3)
- dotenv

## 📝 Notes

- The bot uses SQLite to store data in a local file (`lorebot.db`)
- Each server has its own sections and messages
- Messages can have text content, images, GIFs, and videos

## 🧪 Testing

Run database tests (direct database operations):
```bash
npm test
```

Run integration tests (simulates Discord requests):
```bash
npm run test:integration
```

### Test Coverage

**Database Tests (60 tests)**
- Create section, entry, attachment, tag, alias
- Query by alias, search functionality
- Increment use count, statistics
- Delete section, auto-react operations
- Case-insensitive search, multiple attachments/tags
- Stats after delete (stale data check)
- Section edge cases (duplicate, empty name, spaces, long name, non-existent delete, list with/without data, view valid/empty/non-existent)
- Entry edge cases (without section, duplicate key, long text, emojis, non-existent show)
- Search edge cases (no results, partial match, many results)
- Tag edge cases (duplicate, non-existent, long text)
- Alias edge cases (non-existent target, duplicate, circular)
- Stats edge cases (without data, high volume)
- Delete section with content
- List with many sections
- View section with many elements
- Show ambiguous item (same name in different sections)
- Edit entry, delete entry, copy entry, move entry
- Favorite entry, pin entry, archive entry
- Template operations (create, delete)
- Info command data, entry reactions
- Permissions, cooldowns, global variables

**Integration Tests (82 tests)**
- Help command (general, specific command, non-existent, legibility, examples)
- Section commands (create, list, add, show, delete, view)
- Tag commands (add, search)
- Search by term
- Auto-react (create, update, invalid threshold, invalid emoji, pattern match, bot message, multiple matches, loop prevention)
- Save commands (with section, without ID, duplicate, reply to message)
- Use commands (with variables, misspelled variable, repeated variables, @everyone injection)
- Alias commands (create, show via alias, chain)
- Statistics (display, after commands)
- Increment use counter
- Section edge cases (duplicate, empty name, spaces, long name, non-existent delete, list when empty, view empty/non-existent)
- Entry edge cases (without section, duplicate key, long text, emojis)
- Tag edge cases (duplicate, long text)
- Alias edge cases (duplicate, circular)
- Delete section with content
- List with many sections
- View section with many elements
- Show ambiguous item
- Search with many results
- Edit entry, delete entry, copy entry, move entry
- Random entry, recent entries, popular entries, trending entries
- Favorite entry, pin entry, archive entry
- Template operations (create, list, delete)
- Ping, info, setvar, listvar
- Entry reactions, permissions, cooldowns
