const Command = require('#lib/structures/Command.js');

module.exports = class extends Command {
	name = 'ping';
	aliases = [];

	async run(message) {
		message.editReply('Pong!');
	}
};
