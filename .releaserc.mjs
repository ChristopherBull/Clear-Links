export default {
  branches: [ 'main' ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      'semantic-release-chrome',
      {
        extensionId: `${process.env.EXTENSION_ID}`,
        asset: 'clear-links-extension.zip',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [ 'clear-links-extension.zip' ],
      },
    ],
  ],
};
