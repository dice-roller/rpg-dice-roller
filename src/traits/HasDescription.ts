import Description from '../Description.js';
import {Stringable} from "../types/Interfaces/Stringable";
import {JsonSerializable} from "../types/Interfaces/JsonSerializable";
import {Describable} from "../types/Interfaces/Describable";

/**
 * A base class for description functionality.
 *
 * @abstract
 */
class HasDescription implements Describable, JsonSerializable, Stringable {
  #description: Description|null = null;

  constructor(text: Description|string|null = null) {
    this.description = text;
  }

  /**
   * The description for the group.
   *
   * @return {Description|null}
   */
  get description(): Description|null {
    return this.#description || null;
  }

  /**
   * Set the description on the group.
   *
   * @param {Description|string|null} description
   */
  set description(description: Description|string|null) {
    if (!description) {
      this.#description = null;
    } else if (description instanceof Description) {
      this.#description = description;
    } else if (typeof description === 'string') {
      this.#description = new Description(description);
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
  toJSON(): {description: Description|null} {
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
  toString(): string {
    if (this.description) {
      return `${this.description}`;
    }

    return '';
  }
}

export default HasDescription;
