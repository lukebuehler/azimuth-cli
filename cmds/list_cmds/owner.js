const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth} = require('../../utils')

exports.command = 'owner <addr>'
exports.desc = 'List points of which the <addr> is owner.'
exports.builder = (yargs) =>{
  yargs.positional('addr', {type: 'string'})
}

exports.handler = async function (argv) {
  let addr = validate.address(argv.addr, true);
  const ctx = await eth.createContext(argv);
  let points = await ajs.azimuth.getOwnedPoints(ctx.contracts, addr);
  console.log(`listing ${points.length} owned points by ${addr}:`);
  for(const p of points)
  {
    const patp = ob.patp(p);
    console.log(`${patp}, ${p}`);
  }
}