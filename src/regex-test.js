/**
 * A JS based dice roller that uses dice notation, as described here:
 * https://en.m.wikipedia.org/wiki/Dice_notation
 *
 * @version v3.0.1
 * @author GreenImp - greenimp.co.uk
 * @link https://github.com/GreenImp/rpg-dice-roller
 */
import DiceRoller from './dice-roller.js';
import DiceRoll from './dice-roll.js';
import {diceUtils, exportFormats} from './utils.js';
import '../node_modules/xregexp/xregexp-all.js';

/*const dateReg = XRegExp(
  `(?<year>[0-9]{4})-? # year
           (?<month>[0-9]{2})-? # month
           (?<day>[0-9]{2}) # day`,
  'x'
);*/
let notation = `2d4+(2d6+3d4)-(10d4-L+(d6*2))+2`;
//notation = '10d4+(d6*2)';

console.log('Notation:', notation);
const diceRoller = new DiceRoller();
diceRoller.roll(notation);
console.log(diceRoller.log);
console.log(diceRoller.total);

export { DiceRoller, DiceRoll, diceUtils, exportFormats };
