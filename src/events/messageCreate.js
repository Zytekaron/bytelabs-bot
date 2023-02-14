const Event = require('#lib/structures/Event.js');

module.exports = class extends Event {
    name = 'messageCreate';

    async run(message, edited = false) {
        // add utility method for edit-replies.
        Object.assign(message, {
            editSend: (...data) => intelReply(message, 'send', ...data),
            editSendTo: (...data) => intelReply(message, 'sendTo', ...data),
            editReply: (...data) => intelReply(message, 'reply', ...data),
        });

        const { commandPrefix, commands, tagPrefix, tags } = this.client;
        const properties = { edited };

        if (message.content.startsWith(commandPrefix)) {
            return this.runGeneric(message, commands, commandPrefix, properties);
        }
        if (message.content.startsWith(tagPrefix)) {
            return this.runGeneric(message, tags, tagPrefix, properties);
        }
    }

    async runGeneric(message, entryMap, prefix, properties) {
        const args = message.content
            .slice(prefix.length)
            .trim()
            .split(' ');
        const name = args.shift();

        const handler = entryMap.get(name.toLowerCase());
        if (handler) {
            return handler.run(message, args, properties);
        }
    }
};

async function intelReply(message, superCall, ...data) {
    const sentBefore = message.client.replies.get(message.id);
    if (sentBefore) {
        return sentBefore.edit(...data);
    }

    let sent;
    switch (superCall) {
        case 'send':
            sent = await message.channel.send(...data);
            break;
        case 'sendTo':
            const channel = message.client.channels.resolve(data[0]);
            sent = await channel.send(...data.slice(1));
            break;
        case 'reply':
            sent = await message.reply(...data);
            break;
        default:
            throw new Error('invalid reply type');
    }

    message.client.replies.set(message.id, sent);
    return sent;
}
