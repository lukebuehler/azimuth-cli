#!/usr/bin/env node

const config = require('./cli-config')

require('yargs')
  .scriptName("azimuth-cli")
  .commandDir('cmds')
  .demandCommand()
  .options(config.getUniversalOptions())
  .help()
  .argv
