const Command = require('#lib/structures/Command.js');

const tags = require('#src/tags.js');

module.exports = class extends Command {
    name = 'tags';
    aliases = ['tag'];

    async run(message, [tagName]) {
        if (!tagName) {
            const list = tags
                .map(tag => tag.name)
                .join(', ');

            return message.editReply('Available tags: ' + list);
        }

        const tag = this.client.tags.get(tagName);
        if (tag) {
            const list = [
                'Name: ' + tag.name,
                'Aliases: ' + tag.aliases.join(', ')
            ];
            if (tag.rawText) {
                // include \n prefix when the tag spans multiple lines
                const nl = tag.rawText.includes('\n') ? '\n' : '';

                list.push('Text: ' + nl + tag.rawText);
            }
            return message.editReply(list.join('\n'));
        }

        return message.editReply('tag not found');
    }
}
