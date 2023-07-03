const textSymbol = Symbol.for('text');
const typeSymbol = Symbol.for('type');

class Description {
  static types = {
    MULTILINE: 'multiline',
    INLINE: 'inline',
  };

  constructor(text, type = Description.types.INLINE) {
    this.text = text;
    this.type = type;
  }

  getText() {
    return this[textSymbol];
  }

  setText(text) {
    if (typeof text === 'number') {
      throw new TypeError('Description text is invalid');
    } else if (!text && text !== 0 || `${text}`.trim() === '') {
      throw new TypeError('Description text cannot be empty');
    }

    this[textSymbol] = `${text}`.trim();
  }

  getType() {
    return this[typeSymbol];
  }

  setType(type) {
    const types = Object.values(Description.types);

    if (typeof type !== 'string' || !type.trim()) {
      throw new TypeError('Description type must be a non-empty string');
    } else if (!types.includes(type)) {
      throw new RangeError(`Description type must be one of: ${types.join(', ')}`);
    }

    this[typeSymbol] = type;
  }

  toJSON() {
    const { text, type } = this;

    return {
      text,
      type,
    };
  }

  toString() {
    if (this.getType() === Description.types.INLINE) {
      return `# ${this.getText()}`;
    }

    return `[${this.getText()}]`;
  }
}

export default Description;
