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
}

exports.handler = async function (argv) {
  const point = validate.point(argv.point, true);
  const ctx = await eth.createContext(argv);
  const dominion = await azimuth.getDominion(ctx.contracts, point);

  let childPoints = 
    dominion == 'l1' 
    ? (await getchildPointsFromL1(argv, ctx, point))
    : (await getchildPointsFromL2(argv, point));

  console.log(`listing ${childPoints.length} children under ${ob.patp(point)} (${point}):`);
  for(const p of childPoints)
  {
    const patp = ob.patp(p);
    console.log(`${patp} (${p})`);
  }
}


async function getchildPointsFromL1(argv, ctx, point){
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


