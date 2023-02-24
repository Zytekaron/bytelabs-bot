module.exports = class {
    constructor(input, globalResolver = null) {
        if (input.length == 0) {
            throw new Error('blank input');
        }

        this.globalResolver = globalResolver;

        this.segments = this._calculatePrefill(input);
        this.minArgs = this._calculateMinArgs(this.segments);
    }

    static evalWithContext(context = {}) {
        return function (source) {
            // bypass strict mode
            const fn = Function('with (arguments[0]) { return eval(arguments[1]); }');

            return fn(context, source);
        }
    }

    fill(args, resolver = this.globalResolver) {
        if (args.length < this.minArgs) {
            throw new Error('not enough arguments');
        }

        let argsIndex = 0;
        const resolveSegment = (segment) => {
            switch (segment.type) {
                case 'text':
                    return segment.value;
                case 'positional':
                    return args[argsIndex++];
                case 'indexed':
                    return args[segment.value];
                case 'expression':
                    return resolver(segment.value);
            }
        }

        const buf = [];
        for (const segment of this.segments) {
            buf.push(resolveSegment(segment));
        }
        return buf.join('');
    }

    _calculateMinArgs(segments) {
        let positional = 0;
        let indexed = 0;

        for (const segment of segments) {
            switch (segment.type) {
                case 'positional':
                    positional++;
                    break;
                case 'indexed':
                    indexed = Math.max(indexed, segment.value);
                    break;
            }
        }

        return Math.max(positional, indexed);
    }

    _calculatePrefill(input) {
        const segments = [];
        const segmentTextBuffer = [];

        let inputIndex = 0;
        let nextChar = () => input[inputIndex++];

        const commit = () => {
            if (segmentTextBuffer.length > 0) {
                segments.push({
                    type: 'text',
                    value: segmentTextBuffer.join('')
                })
                segmentTextBuffer.length = 0;
            }
        };

        let positionalIndex = 0;

        // loop over the regular string looking for variables
        while (inputIndex < input.length) {
            const c = nextChar();

            switch (c) {
                case '\\': // skip \*
                    segmentTextBuffer.push(nextChar());
                    continue;
                case '{': // write text buffer and read variable at {
                    commit();
                    readVariable();
                    break;
                default:
                    segmentTextBuffer.push(c);
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
                    segments.push({
                        type: 'positional',
                        value: positionalIndex++,
                    });
                } else if (/^\d+$/g.test(str)) { // {123}
                    segments.push({
                        type: 'indexed',
                        value: parseInt(str),
                    });
                } else { // {'hello, world!'.length + 3}
                    segments.push({
                        type: 'expression',
                        value: str,
                    });
                }
            }
        }

        commit();

        return segments;
    }
}
