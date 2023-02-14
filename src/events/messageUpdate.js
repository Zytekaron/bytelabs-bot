const Event = require('#lib/structures/Event.js');

// The number of milliseconds to allow the message to
// be edited and be re-executed as an edit command/tag.
const editTime = 2 * 60 * 1000; // 2 minutes

module.exports = class extends Event {
    name = 'messageUpdate';

    async run(oldMessage, newMessage) {
        if (oldMessage.content == newMessage.content) {
            return;
        }
        if (newMessage.editedTimestamp - oldMessage.createdTimestamp > editTime) {
            // react to command- or tag-like messages with ❌
            // to indicate their allowed edit period is expired.
            const commandPrefix = newMessage.content.startsWith(this.client.commandPrefix);
            const tagPrefix = newMessage.content.startsWith(this.client.tagPrefix);
            if (commandPrefix || tagPrefix) {
                newMessage.react('❌');
            }
            return;
        }

        return this.client.events
            .get('messageCreate')
            .run(newMessage, true);
    }
};
