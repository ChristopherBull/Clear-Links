const AMO_NOTES_LIMIT = 3000;

const PRIORITY_SECTIONS = [
  '✨ Features',
  '🐛 Bug Fixes',
  '⚡ Performance Improvements',
];

const GITHUB_FOOTER = '\n\nSee full release notes on GitHub.';

const truncateReleaseNotes = (notes, limit = AMO_NOTES_LIMIT) => {
  if (!notes) return notes;
  if (notes.length <= limit) return notes;

  // Split into sections (## headings from conventional commits)
  const sections = notes.split('\n## ');

  // Preserve intro (first chunk before any ##)
  const intro = sections[0];
  const rest = sections.slice(1).map(s => '## ' + s);

  // Extract priority sections first
  const priority = [];
  const others = [];

  for (const section of rest) {
    if (PRIORITY_SECTIONS.some(title => section.startsWith(`## ${title}`))) {
      priority.push(section);
    } else {
      others.push(section);
    }
  }

  // Build output prioritising important sections
  let output = intro;

  for (const section of [ ...priority, ...others ]) {
    if ((output + '\n' + section + GITHUB_FOOTER).length > limit) break;
    output += '\n' + section;
  }

  // Final hard truncate safeguard
  if ((output + GITHUB_FOOTER).length > limit) {
    output = output.slice(0, limit - GITHUB_FOOTER.length - 1);
  }

  return output.trim() + GITHUB_FOOTER;
};

const cacheFullReleaseNotes = {
  name: 'cache-full-release-notes',
  prepare: (_, { nextRelease }) => {
    if (!nextRelease || nextRelease.fullNotes) return;
    nextRelease.fullNotes = nextRelease.notes;
  },
};

const truncateNotesForAmo = {
  name: 'truncate-notes-for-amo',
  prepare: (_, { nextRelease }) => {
    if (!nextRelease) return;
    nextRelease.notes = truncateReleaseNotes(nextRelease.notes);
  },
};

const restoreFullReleaseNotes = {
  name: 'restore-full-release-notes',
  publish: (_, { nextRelease }) => {
    if (!nextRelease?.fullNotes) return;
    nextRelease.notes = nextRelease.fullNotes;
  },
};

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
    cacheFullReleaseNotes,
    [
      'semantic-release-chrome',
      {
        extensionId: `${process.env.EXTENSION_ID}`,
        asset: 'clear-links-extension-chrome.zip',
        distFolder: 'dist/chrome',
      },
    ],
    truncateNotesForAmo,
    [
      'semantic-release-amo',
      {
        addonId: '{606f9f3d-1c71-463d-a1aa-d10cf1e4aa64}',
        addonDirPath: 'dist/firefox',
        addonZipPath: './clear-links-extension-firefox.zip',
        submitReleaseNotes: true,
      },
    ],
    restoreFullReleaseNotes,
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
