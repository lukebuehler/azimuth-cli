#!/usr/bin/env node

require('yargs')
  .scriptName("azimuth-cli")
  .commandDir('cmds')
  .demandCommand()
  .help()
  .argv
