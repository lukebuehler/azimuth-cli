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


function ensureDefaultConfigFile(){
  //todo: use a standard location for this and generate if the file does not exist
  return "~/dev/azimuth-cli/cli-config.json";
}

function getUniversalOptions()
{
  return{
    'd':{
      alias: 'work-dir',
      describe: 'The work directory for the current command, mandatory for some commands. If it does not exist, it will be created.',
      default: '.',
      type: 'string',
    },
    'm':{
      alias: 'use-mainnet',
      describe: 'If the Ethereum mainnet should be used.',
      default: false,
      type: 'boolean'
    },
    'config-file':{
      describe: 'What config file to use.',
      default: ensureDefaultConfigFile(),
      type: 'string',
    },
  }
}
