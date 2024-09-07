export default {
  branches: [ 'main' ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
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
