const ob = require('urbit-ob')
const {validate, eth, rollerApi} = require('../../utils')

exports.command = 'owner <addr>'
exports.desc = 'List points of which the <addr> is owner.'
exports.builder = (yargs) =>{
  yargs.positional('addr', {type: 'string'})
}

exports.handler = async function (argv) {
  let addr = validate.address(argv.addr, true);
  const rollerClient = rollerApi.createClient();

  let points = await rollerApi.getShips(rollerClient, addr);
  console.log(`listing ${points.length} owned points by ${addr}:`);
  for(const p of points)
  {
    const patp = ob.patp(p);
    console.log(`${patp}, ${p}`);
  }
}