import Description from '../Description.js';

const descriptionSymbol = Symbol('description');

class HasDescription {
  constructor(text = null) {
    this.description = text;
  }

  /**
   * The description for the group.
   *
   * @return {Description|null}
   */
  get description() {
    return this[descriptionSymbol] || null;
  }

  /**
   * Set the description on the group.
   *
   * @param {Description|string|null} description
   */
  set description(description) {
    if (!description && (description !== 0)) {
      this[descriptionSymbol] = null;
    } else if (description instanceof Description) {
      this[descriptionSymbol] = description;
    } else if (typeof description === 'string') {
      this[descriptionSymbol] = new Description(description);
    } else {
      throw new TypeError(`description must be of type Description, string or null. Received ${typeof description}`);
    }
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{description: (Description|null)}}
   */
  toJSON() {
    const { description } = this;

    return {
      description,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @see {@link RollGroup#notation}
   *
   * @returns {string}
   */
  toString() {
    if (this.description) {
      return `${this.description}`;
    }

    return '';
  }
}

export default HasDescription;
