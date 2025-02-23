const tspegjs = require('ts-pegjs');

module.exports = {
  format: 'es',
  plugins: [tspegjs],
  dependencies: {
    '{ evaluate }': '../../utilities/math',
    '* as Dice': '../../dice/index',
    '* as Modifiers': '../../modifiers/index',
    'ComparePoint': '../../ComparePoint',
    'RollGroup': '../../RollGroup',
    'Description': '../../Description',
    '{ DescriptionType }': '../../types/Enums/DescriptionType',
  },
  tspegjs: {
    skipTypeComputation: true,
  },
};
