import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'wsgate',
  description:
    'Interactive Swagger-like UI for NestJS Socket.IO Gateway Events',
  base: '/wsgate/',

  themeConfig: {
    logo: 'https://github.com/shaishab316/wsgate/blob/main/packages/ui/src/assets/icon.png?raw=true',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@wsgate/nest' },
      { text: 'GitHub', link: 'https://github.com/shaishab316/wsgate' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quick Start', link: '/guide/quick-start' },
        ],
      },
      {
        text: 'Adapters',
        items: [
          { text: 'NestJS', link: '/guide/introduction' },
          { text: 'Express', link: '/guide/express' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'WsgateModule', link: '/api/wsgate-module' },
          { text: 'WsgateExplorer', link: '/api/wsgate-explorer' },
          { text: '@WsDoc', link: '/api/ws-doc' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shaishab316/wsgate' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@wsgate/nest' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Shaishab Chandra Shil',
    },
  },
});
