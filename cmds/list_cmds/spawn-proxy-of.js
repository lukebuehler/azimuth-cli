const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth} = require('../../utils')

exports.command = 'spawn-proxy-of <point>'
exports.desc = 'Outputs the spawn proxy address of the provided <point>.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  const point = validate.point(argv.point, true);
  const ctx = await eth.createContext(argv);
  const spawnProxyAddress = await ajs.azimuth.getSpawnProxy(ctx.contracts, point);

  if(spawnProxyAddress && !ajs.utils.addressEquals('0x0000000000000000000000000000000000000000', spawnProxyAddress)){
    console.log(spawnProxyAddress.toLowerCase());
  }
  else{
    console.log(`Point ${ob.patp(point)} (${point}) does not have a spawn proxy set.`)
  }
}