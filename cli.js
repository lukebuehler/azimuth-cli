#!/usr/bin/env node

const {files} = require('./utils')

require('yargs')
  .scriptName("azimuth-cli")
  .commandDir('cmds')
  .demandCommand()
  .options(getUniversalOptions())
  .config('config-file', configFile => files.readJsonObject('', configFile))
  .help()
  .argv

function getUniversalOptions()
{
  return{
    'd':{
      alias: 'work-dir',
      describe: 'The work directory for the current command, mandatory for some commands. If it does not exist, it will be created.',
      default: '.',
      type: 'string',
    },
    'eth-provider':{
      describe: 'What Ethereum provider to use.',
      default: 'mainnet',
      choices: ['ganache', 'ropsten', 'mainnet'],
      type: 'string'
    },
    'roller-provider':{
      describe: 'What L2 roller provider to use.',
      default: 'urbit',
      choices: ['local', 'urbit'],
      type: 'string'
    },
    'config-file':{
      describe: 'What config file to use.',
      default: files.ensureDefaultConfigFilePath(),
      type: 'string',
    },
  }
}
