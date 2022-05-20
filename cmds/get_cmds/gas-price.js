const ajs = require('azimuth-js')
const {validate, eth} = require('../../utils')

exports.command = 'gas-price'
exports.desc = 'Lists the current Ethereum gas prices computed by etherscan.io. These can be used to set the max-fee in the modify commands. API is rate limited.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  var gasPrices = await eth.getCurrentGasPrices();
  console.log(JSON.stringify(gasPrices, null, 2));
}