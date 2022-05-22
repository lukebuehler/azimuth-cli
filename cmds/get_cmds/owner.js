const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth, rollerApi} = require('../../utils')

exports.command = 'owner <addr>'
exports.desc = 'List points of which the <addr> is owner.'
exports.builder = (yargs) =>{
  yargs.positional('addr', {type: 'string'});

  yargs.option('use-roller',{
    alias: 'l2',
    describe: 'Enforce using the roller (L2) for all data and do not allow fallback to azimuth (L1).',
    type: 'boolean',
    conflicts: 'use-azimuth'
  });
  yargs.option('use-azimuth',{
    alias: 'l1',
    describe: 'Enforce using azimuth (L1) for all data and do not allow fallback to the roller (L2).',
    type: 'boolean',
    conflicts: 'use-roller'
  });
}

exports.handler = async function (argv) {
  let addr = validate.address(argv.addr, true);

  let points = [];
  const source = await rollerApi.selectDataSource(argv);
  if(source == 'roller'){
    let rollerClient = rollerApi.createClient(argv);
    points = await rollerApi.getShips(rollerClient, addr);
  }
  else
  {
    const ctx = await eth.createContext(argv);
    points = await ajs.azimuth.getOwnedPoints(ctx.contracts, addr);
  }

  console.log(`listing ${points.length} owned points by ${addr}:`);
  for(const p of points)
  {
    const patp = ob.patp(p);
    console.log(`${patp}, ${p}`);
  }
}