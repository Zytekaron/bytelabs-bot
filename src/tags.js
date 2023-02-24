// just because you can, doesn't mean you should

const Filler = require('#src/utils/filler.js');

module.exports = [];

// Server-related
addTag({
    name: 'rule',
    aliases: ['r'],
    minArgs: 1,
    handler: (message, [rule]) => {
        message.editSend('please read rule ' + rule);
    }
});

// Support-related
addTag({
    name: 'dontasktoask',
    aliases: ['data'],
    rawText: 'https://dontasktoask.com',
});
addTag({
    name: 'xyproblem',
    aliases: ['xy-problem', 'xy'],
    rawText: `https://xyproblem.info`,
});
addTag({
    name: 'nohello',
    aliases: ['nohi'],
    rawText: `https://nohello.net`,
});
addTag({
    name: 'goodquestion',
    aliases: ['goodq', 'howtoask', 'how2ask'],
    rawText: `https://stackoverflow.com/help/how-to-ask`,
});
addTag({
    name: 'hug',
    aliases: ['hugs'],
    rawText: `{message.author} hugs {0}`,
});

function addTag({ name, aliases, rawText, minArgs, handler }) {
    if (handler) {
        module.exports.push({
            name,
            aliases,
            rawText,
            run: applyFilters(
                handler,
                filterMinArgs(minArgs)
            ),
        });
    } else {
        const filler = new Filler(rawText);
        const handler = replyFactory(filler);

        module.exports.push({
            name,
            aliases,
            rawText,
            run: applyFilters(
                handler,
                filterMinArgs(filler.minArgs)
            ),
        });
    }
}

function replyFactory(filler) {
    return async (message, args) => {
        // get text for reply
        const text = filler.fill(args, Filler.evalWithContext({
            message,
            client: message.client,
            author: message.author,
            member: message.member,
        }));

        // reply and delete message concurrently
        const reply = message.editSend(text);
        const remove = message.delete();
        await Promise.all([reply, remove]);

        // return sent message
        return reply;
    };
}

// Filters

function applyFilters(handler, ...filters) {
    for (const filter of filters) {
        handler = filter(handler);
    }
    return handler;
}

function filterMinArgs(requiredArgs) {
    return (next) => {
        return (message, args) => {
            if (args.length < requiredArgs) {
                return message.editSend('not enough args!');
            }
            return next(message, args);
        };
    }
}
