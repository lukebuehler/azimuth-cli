const fs = require("fs");
const path = require('path');

const defaultConfigFile = "./cli-config.json";

function readConfig(configFile){
  configFile ??= defaultConfigFile;
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

function initConfig(argv){
  let config = readConfig(argv.configFile) ?? {};

  //todo: override from args
  config.useMainnet ??= false; 

  //todo: validate basic config

  return config;
}

module.exports = {
  initConfig
}


