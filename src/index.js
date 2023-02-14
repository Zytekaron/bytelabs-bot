require('dotenv').config();
process.chdir(__dirname);

const { Client, GatewayIntentBits: Intents } = require('discord.js');
const fswalk = require('./utils/walk');

const client = new Client({
    intents: [
        Intents.Guilds,
        Intents.GuildMembers,
        Intents.GuildModeration,
        Intents.GuildEmojisAndStickers,
        Intents.GuildIntegrations,
        Intents.GuildWebhooks,
        Intents.GuildInvites,
        Intents.GuildVoiceStates,
        Intents.GuildPresences,
        Intents.GuildMessages,
        Intents.GuildMessageReactions,
        Intents.GuildMessageTyping,
        Intents.DirectMessages,
        Intents.DirectMessageReactions,
        Intents.DirectMessageTyping,
        Intents.MessageContent,
        Intents.GuildScheduledEvents,
        Intents.AutoModerationConfiguration,
        Intents.AutoModerationExecution,
    ],
    allowedMentions: {
        repliedUser: false,
    },
});

Object.assign(client, {
    events: new Map(),

    commandPrefix: '!',
    commands: new Map(),

    tagPrefix: '?',
    tags: new Map(),

    replies: new Map(),
});

const handlerPredicate = file => file.endsWith('.js') && !file.startsWith('~');

(async () => {
    // Load tags
    const tags = require('./tags');
    for (const tag of tags) {
        client.tags.set(tag.name, tag);

        for (const alias of tag.aliases || []) {
            client.tags.set(alias, tag);
        }
    }

    // Load commands
    for await (const file of fswalk('./commands', handlerPredicate)) {
        const Command = require('./' + file);

        const command = new Command(client);
        client.commands.set(command.name, command);

        for (const alias of command.aliases || []) {
            client.commands.set(alias, command);
        }
    }

    // Load events
    for await (const file of fswalk('./events', handlerPredicate)) {
        const Event = require('./' + file);

        const event = new Event(client);
        client.events.set(event.name, event);

        client.on(event.name, (...args) => {
            event.run(...args);
        });
    }
})();

client.login(process.env.BOT_TOKEN);
