const Command = require('#lib/structures/Command.js');

module.exports = class extends Command {
    name = 'tags';
    aliases = ['tag'];

    async run(message, [tagName]) {
        if (!tagName) {
            const list = Array.from(this.client.tags.values()).join(', ');

            return message.editReply(list);
        }

        const tag = client.tags.get(tagName);
        if (tag) {
            return message.editReply([
                'Name: ' + tag.name,
                'Aliases: ' + tag.aliases.join(', '),
                'Text: ' + tag.rawText
            ].join('\n'));
        }
    }
}
