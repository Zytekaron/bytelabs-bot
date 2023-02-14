const Event = require('#lib/structures/Event.js');

class BASE { constructor(client) { this.client = client; } }
module.exports = class extends BASE {
    name = 'ready';

    constructor(client) {
        super(client);
    }

    async run() {
        console.log('Logged in as:', this.client.user.tag);
    }
};
