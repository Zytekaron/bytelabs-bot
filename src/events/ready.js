const Event = require('#lib/structures/Event.js');

module.exports = class extends Event {
    name = 'ready';

    constructor(client) {
        super(client);
    }

    async run() {
        console.log('Logged in as:', this.client.user.tag);
    }
};
