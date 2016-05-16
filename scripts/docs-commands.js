var aliases = require('../dist/aliases').aliases
var writeFileSync = require('fs').writeFileSync
var join = require('path').join

var commands = [
  {
    title: 'Install',
    description: [
      '**Please note:** `npm` and `bower` resolve using their respective algorithms over the local filesystem. They will need to be installed before running `typings install`. The other schemes (`http`, `https`, `github`, `bitbucket`) resolve over HTTP(s). Finally, file is a location in the local filesystem relative to the `typings.json` directory.',
      '',
      'Write a dependency to the `typings/` directory, optionally persisting it in `typings.json`.'
    ].join('\n'),
    help: aliases.install.help()
  },
  {
    title: 'Uninstall',
    description: 'Remove a dependency from the typings/ directory, and optionally remove from `typings.json`.',
    help: aliases.uninstall.help()
  },
  {
    title: 'Init',
    description: 'Initialize a new typings.json file. If you\'re currently using TSD, you can use `--upgrade` to convert `tsd.json` to `typings.json`.',
    help: aliases.init.help()
  },
  {
    title: 'List',
    description: 'Print the typings dependency tree.',
    help: aliases.list.help()
  },
  {
    title: 'Bundle',
    description: 'Bundle the current project types into an single global module.',
    help: aliases.bundle.help()
  },
  {
    title: 'Search',
    description: 'Search the Typings Registry for type defintions.',
    help: aliases.search.help()
  },
  {
    title: 'Open',
    description: 'Get the full URL from a Typings location',
    help: aliases.open.help()
  },
  {
    title: 'View',
    description: 'Get information for a package on the Typings Registry',
    help: aliases.view.help()
  },
  {
    title: 'Prune',
    description: 'Prune extraneous typings from directory',
    help: aliases.prune.help()
  }
]

var output = [
  '# Commands',
  '',
  'An overview of available commands for `typings`.',
  '',
  commands.map(function (command) {
    return [
      '## ' + command.title,
      '',
      command.description,
      '',
      '```',
      command.help.trim(),
      '```',
      ''
    ].join('\n')
  }).join('\n')
].join('\n')

writeFileSync(join(__dirname, '../docs/commands.md'), output)
