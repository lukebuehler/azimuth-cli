const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth} = require('../../utils')

exports.command = 'owner-of <point>'
exports.desc = 'Outputs the owner address of the provided <point>.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  const point = validate.point(argv.point, true);
  const ctx = await eth.createContext(argv);
  const ownerAddress = await ajs.azimuth.getOwner(ctx.contracts, point);

  if(ownerAddress && !ajs.utils.addressEquals('0x0000000000000000000000000000000000000000', ownerAddress)){
    console.log(ownerAddress.toLowerCase());
  }
  else{
    console.log(`Point ${ob.patp(point)} (${point}) not yet spawned.`)
  }
}