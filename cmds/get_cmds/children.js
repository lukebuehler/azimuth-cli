const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth, azimuth, rollerApi} = require('../../utils')

exports.command = 'children <point>'
exports.desc = 'List all children for <point>, where <point> is patp or p.'
exports.builder = (yargs) =>{
  yargs.option('unspawned',{
    alias: 'u',
    describe: 'Only include unspawned points.',
    type: 'boolean',
    conflicts: 'spawned'
  });
  yargs.option('spawned',{
    alias: 's',
    describe: 'Only include spawned points.',
    type: 'boolean',
    conflicts: 'unspawned'
  });

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
  const point = validate.point(argv.point, true);

  const source = await rollerApi.selectDataSource(argv);
  let childPoints = 
    source == 'azimuth'
    ? (await getchildPointsFromL1(argv, point))
    : (await getchildPointsFromL2(argv, point));

  console.log(`listing ${childPoints.length} children under ${ob.patp(point)} (${point}):`);
  for(const p of childPoints)
  {
    const patp = ob.patp(p);
    console.log(`${patp} (${p})`);
  }
}

async function getchildPointsFromL1(argv, point){
  const ctx = await eth.createContext(argv);
  if(argv.spawned){
    return await ajs.azimuth.getSpawned(ctx.contracts, point);
  }
  else if(argv.unspawned){
    return await ajs.azimuth.getUnspawnedChildren(ctx.contracts, point);
  }
  else{
    return azimuth.getChildren(point);
  }
}

async function getchildPointsFromL2(argv, point){
  const rollerClient = rollerApi.createClient(argv);
  console.log('here')
  if(argv.spawned){
    return await rollerApi.getSpawned(rollerClient, point);
  }
  else if(argv.unspawned){
    return await rollerApi.getUnspawned(rollerClient, point);
  }
  else{
    return azimuth.getChildren(point);
  }
}


