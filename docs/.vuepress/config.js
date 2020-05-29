module.exports = {
  title: 'RPG Dice Roller',
  description: 'A JS based dice roller that can roll various types of dice and modifiers, along with mathematical equations.',
  base: '/rpg-dice-roller/',
  themeConfig: {
    logo: '/hero.svg',
    repo: 'GreenImp/rpg-dice-roller',

    docsDir: 'docs',
    docsBranch: 'feature/70-build-documentation',
    editLinks: true,
    lastUpdated: 'Last Updated',

    smoothScroll: true,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          title: 'Guide',
          children: [
            '',
            'getting-started',
            'usage',
          ],
        },
        {
          title: 'Notation',
          children: [
            'notation/',
            'notation/dice',
            'notation/modifiers',
            'notation/group-rolls',
            'notation/maths',
          ],
        },
      ],
      '/api/': [
        {
          title: 'API',
          collapsable: false,
          children: [
            '',
            'DiceRoller',
            'DiceRoll',
            'RollResult',
            'RollResults',
            'ComparePoint',
            'Parser',
            'exportFormats',
          ],
        }
      ]
    },
  },
  plugins: [
    '@vuepress/back-to-top',
    'dice-roller',
  ],
};
