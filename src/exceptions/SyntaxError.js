import { SyntaxError as ParserSyntaxError } from '../parser/grammars/grammar.js';

class SyntaxError extends ParserSyntaxError {
  constructor(message, expected, found, location) {
    super();

    this.message = message;
    this.expected = expected;
    this.found = found;
    this.location = location;
  }
}

export default SyntaxError;
