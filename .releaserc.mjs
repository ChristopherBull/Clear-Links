export default {
  branches: [ 'main' ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        // Override the default type definitions to include emojis
        presetConfig: {
          types: [
            { type: 'feat', section: '✨ Features' },
            { type: 'fix', section: '🐛 Bug Fixes' },
            { type: 'docs', section: '📚 Documentation' },
            { type: 'style', section: '🖌️ Styles', hidden: true },
            { type: 'refactor', section: '♻️ Code Refactoring' },
            { type: 'perf', section: '⚡ Performance Improvements' },
            { type: 'test', section: '✅ Tests' },
            { type: 'build', section: '🏗️ Build System' },
            { type: 'ci', section: '🤖 Continuous Integration' },
            { type: 'chore', section: '🛠️ Chores', hidden: true },
            { type: 'revert', section: '⏪ Reverts' },
          ],
        },
      },
    ],
    [
      'semantic-release-chrome',
      {
        extensionId: `${process.env.EXTENSION_ID}`,
        asset: 'clear-links-extension-chrome.zip',
        distFolder: 'dist/chrome',
      },
    ],
    [
      'semantic-release-amo',
      {
        addonId: '{606f9f3d-1c71-463d-a1aa-d10cf1e4aa64}',
        addonDirPath: 'dist/firefox',
        addonZipPath: './clear-links-extension-firefox.zip',
        submitReleaseNotes: true,
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          'clear-links-extension-chrome.zip',
          'clear-links-extension-firefox.zip',
        ],
      },
    ],
  ],
};
