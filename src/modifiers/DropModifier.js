import KeepModifier from "./KeepModifier.js";

const DropModifier = (() => {
  class DropModifier extends KeepModifier{
  }

  return DropModifier;
})();

export default DropModifier;
