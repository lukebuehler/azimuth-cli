const cliConfig = require('./cli-config')
const ajs = require('azimuth-js')
const Web3 = require('web3')

function initWeb3(config)
{
  if(config.useMainnet){
    console.log('! RUNNING ON MAINNET !');
  }

  let providerUrl = config.useMainnet ? config.ethProviderMainnet : config.ethProviderRopsten;
  let provider = new Web3.providers.HttpProvider(providerUrl);
  let web3 = new Web3(provider);
  web3.eth.handleRevert = true;
  return web3;
}

async function initContracts(config, web3)
{
  const ropstenContract = ajs.chainDetails.ropsten.azimuth.address;
  const mainnetContract = ajs.chainDetails.mainnet.azimuth.address;
  var azAddress = config.useMainnet ? mainnetContract : ropstenContract;
  contracts = await ajs.initContractsPartial(web3, azAddress);
  return contracts;
}

exports.createContext = async function(argv)
{
  let config = cliConfig.initConfig(argv);
  let web3 = initWeb3(config);
  let contracts = await initContracts(config, web3);
  return {
    config: config,
    web3: web3,
    contracts: contracts,
  }
}
