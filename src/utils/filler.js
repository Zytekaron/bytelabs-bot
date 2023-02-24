module.exports = class {
    constructor(input, globalResolver = null) {
        if (input.length == 0) {
            throw new Error('blank input');
        }

        this.globalResolver = globalResolver;

        const { text, args } = this._calculatePrefill(input);
        this.text = text;
        this.args = args;
        this.expectedArgs = this._calculateExpectedArgs(args);
    }

    static evalWithContext(context = {}) {
        return function (source) {
            // bypass strict mode
            const fn = Function('with (arguments[0]) { return eval(arguments[1]); }');

            return fn(context, source);
        }
    }

    fill(args, resolver = this.globalResolver) {
        if (args.length < this.expectedArgs) {
            throw new Error('not enough arguments');
        }

        let argsIndex = 0;
        const resolveArg = (arg) => {
            switch (arg.type) {
                case 'positional':
                    return args[argsIndex++];
                case 'indexed':
                    return args[arg.value];
                case 'expression':
                    return resolver(arg.value);
            }
        }

        const buf = [this.text[0]];

        for (let i = 0; i < this.args.length; i++) {
            buf.push(resolveArg(this.args[i]));
            buf.push(this.text[i + 1]);
        }

        return buf.join('');
    }

    _calculateExpectedArgs(args) {
        let positional = 0;
        let indexed = 0;

        for (const arg of args) {
            switch (arg.type) {
                case 'positional':
                    positional++;
                    break;
                case 'indexed':
                    indexed = Math.max(indexed, arg.value);
                    break;
            }
        }

        return Math.max(positional, indexed);
    }

    _calculatePrefill(input) {
        const text = []; // surrounding text segments
        const args = []; // infilled arguments

        let inputIndex = 0;
        let nextChar = () => input[inputIndex++];

        let textIndex = 0;
        let pushText = str => {
            text[textIndex] ??= '';
            text[textIndex] += str;
        }

        let positionalIndex = 0;

        // loop over the regular string looking for variables
        while (inputIndex < input.length) {
            const c = nextChar();

            switch (c) {
                case '\\': // skip \*
                    pushText(nextChar());
                    continue;
                case '{': // read variable at {
                    readVariable();
                    break;
                default:
                    pushText(c);
            }

            // read and evaluate variables from the string
            function readVariable() {
                const start = inputIndex;

                // iterate until the end of the variable at an unescaped '}'
                loop:
                while (inputIndex < input.length) {
                    switch (nextChar()) {
                        case '\\': // skip \*
                            continue;
                        case '}': // end on }
                            break loop;
                    }
                }

                const str = input.substring(start, inputIndex - 1);
                if (str.length == 0) { // {}
                    args.push({
                        type: 'positional',
                        value: positionalIndex++,
                    });
                } else if (/^\d+$/g.test(str)) { // {123}
                    args.push({
                        type: 'indexed',
                        value: parseInt(str),
                    });
                } else { // {'hello, world!'.length + 3}
                    args.push({
                        type: 'expression',
                        value: str,
                    });
                }

                textIndex++;
            }
        }

        return { text, args };
    }
}
