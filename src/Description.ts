import { DescriptionType } from "./types/Enums/DescriptionType";

/**
 * Represents a Roll / Roll group description.
 */
class Description {
  #text: string = '';
  #type: DescriptionType = DescriptionType.Inline;

  /**
   * Create a `Description` instance.
   *
   * @param {string} text
   * @param {string} [type=inline]
   */
  constructor(text: string, type: DescriptionType = DescriptionType.Inline) {
    this.text = text;
    this.type = type;
  }

  /**
   * The description text.
   *
   * @return {string}
   */
  get text(): string {
    return this.#text;
  }

  /**
   * Set the description text.
   *
   * @param {string|number} text
   */
  set text(text: string) {
    if (typeof text === 'object') {
      throw new TypeError('Description text is invalid');
    } else if ((!text && ((text as unknown) !== 0)) || (`${text as unknown}`.trim() === '')) {
      throw new TypeError('Description text cannot be empty');
    }

    this.#text = `${text as unknown}`.trim();
  }

  /**
   * The description type.
   *
   * @return {string} "inline" or "multiline"
   */
  get type(): DescriptionType {
    return this.#type;
  }

  /**
   * Set the description type.
   *
   * @param {string} type
   */
  set type(type: DescriptionType) {
    const types = Object.values(DescriptionType);

    if (typeof type !== 'string') {
      throw new TypeError('Description type must be a string');
    } else if (!types.includes(type)) {
      throw new RangeError(`Description type must be one of; ${types.join(', ')}`);
    }

    this.#type = type;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @return {{text: string, type: string}}
   */
  toJSON(): {text: string, type: DescriptionType} {
    const { text, type } = this;

    return {
      text,
      type,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @see {@link Description#text}
   *
   * @returns {string}
   */
  toString(): string {
    if (this.type === DescriptionType.Inline) {
      return `# ${this.text}`;
    }

    return `[${this.text}]`;
  }
}

export default Description;
