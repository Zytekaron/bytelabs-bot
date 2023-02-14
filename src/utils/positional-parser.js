module.exports = (input, args, resolver) => {
    let inputIndex = 0;
    let nextChar = () => input[inputIndex++];

    let argIndex = 0;
    let nextArg = () => args[argIndex++];

    const outBuf = [];

    // loop over the regular string looking for variables
    while (inputIndex < input.length) {
        const c = nextChar();

        switch (c) {
            case '\\':
                // character escape within string (used for '{')
                varBuf.push(nextChar());
                continue;
            case '{':
                readVariable();
                break;
            default:
                outBuf.push(c);
        }

        // read and evaluate variables from the string
        function readVariable() {
            const varBuf = [];

            loop:
            while (inputIndex < input.length) {
                const c = nextChar();

                switch (c) {
                    case '\\':
                        // character escape within variable (used for '{')
                        varBuf.push(nextChar());
                        continue;
                    case '}':
                        // exit variable on }
                        break loop;
                    default:
                        varBuf.push(c);
                }
            }

            const str = varBuf.join('');
            if (str.length == 0) { // {}
                outBuf.push(nextArg());
            } else if (!isNaN(str)) { // {123}
                outBuf.push(args[+str]);
            } else { // {'hello, world!'.length + 3}
                outBuf.push(resolver(str));
            }
        }
    }

    return outBuf.join('');
}

