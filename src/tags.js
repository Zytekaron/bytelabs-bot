// just because you can, doesn't mean you should

const parser = require('#src/utils/positional-parser.js');

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
    const requiredArgs = minArgs ?? calculateRequiredArgs(rawText);

    const run = handler
        ? handler
        : replyFactory(rawText);

    module.exports.push({
        name,
        aliases,
        rawText,
        run: applyFilters(
            run,
            filterMinArgs(requiredArgs)
        ),
    });
}

function replyFactory(source) {
    return async (message, args) => {
        // get text for reply
        const text = getText(source, args, {
            message,
            client: message.client,
            author: message.author,
            member: message.member,
        });

        // reply and delete message concurrently
        const reply = message.editSend(text);
        const remove = message.delete();
        await Promise.all([reply, remove]);

        // return sent message
        return reply;
    };
}

// this function is not safe to use with user input!
function getText(source, args, context) {
    // arrow func + with: used to enclose local scoped variables
    with (context) {
        return parser(source, args, text => eval(text));
    }
}

function calculateRequiredArgs(text) {
    // number of {} args
    const maxOrdered = text.split('{}').length - 1;

    // maximum value {#} arg
    const indexedMatches = text.match(/\{\d+\}/g) || [];
    const maxIndexed = indexedMatches
        .map(v => v.substring(1, v.length - 1))
        .map(v => parseInt(v))
        .sort((a, b) => b - a)
        ?.[0] ?? -1; // (the ?. is an indentation hack!)

    // the larger of the two
    return Math.max(maxOrdered, maxIndexed + 1);
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
