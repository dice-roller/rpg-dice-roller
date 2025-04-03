import { Engine } from "../../Types/Interfaces/NumberGenerator/Engines/Engine";

export const UINT32_MAX = -1 >>> 0;
export const UINT32_SIZE = UINT32_MAX + 1;

class NativeMath implements Engine {
  clone(): NativeMath {
    return new NativeMath();
  }

  next(): number {
    return (Math.random() * UINT32_SIZE) | 0;
  }
}

export default NativeMath;

const engine = new NativeMath();

export {
  engine,
};
