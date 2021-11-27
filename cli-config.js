const fs = require("fs");
const path = require("path");
const wd = require('./utils/work-dir');

function getDefaultConfigFile(){
  //todo: use a standard location for this and generate if the file does not exist
  return "~/dev/azimuth-cli/cli-config.json";
}

function readConfig(configFile){
  configFile ??= getDefaultConfigFile();
  if(configFile)
    configFile = path.resolve(wd.resolveTilde(configFile));
  if(fs.existsSync(configFile))
  {
    try {
      const jsonString = fs.readFileSync(configFile);
      return JSON.parse(jsonString);
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }
  return null;
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
      default: getDefaultConfigFile(),
      type: 'string',
    },
  }
}

function initConfig(argv){
  let config = readConfig(argv.configFile) ?? {};

  //todo: override from args
  config.useMainnet ??= false; 

  //todo: validate basic config

  return config;
}

module.exports = {
  getUniversalOptions,
  initConfig
}


