const tspegjs = require('ts-pegjs');

module.exports = {
  format: 'es',
  plugins: [tspegjs],
  dependencies: {
    '{ evaluate }': '../../Utilities/math',
    '* as Dice': '../../Dice/index',
    '* as Modifiers': '../../Modifiers/index',
    'ComparePoint': '../../ComparePoint',
    'RollGroup': '../../RollGroup',
    'Description': '../../Description',
    '{ DescriptionType }': '../../Types/Enums/DescriptionType',
  },
  tspegjs: {
    skipTypeComputation: true,
  },
};
