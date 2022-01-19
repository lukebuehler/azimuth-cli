const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth, azimuth} = require('../../utils')

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
  
  let childPoints = null;
  if(argv.spawned){
    childPoints = await ajs.azimuth.getSpawned(ctx.contracts, point);
  }
  else if(argv.unspawned){
    childPoints = await azimuth.getUnspawnedChildren(ctx.contracts, point);
  }
  else{
    childPoints = azimuth.getChildren(point);
  }

  console.log(`listing ${childPoints.length} children under ${ob.patp(point)} (${point}):`);
  for(const p of childPoints)
  {
    const patp = ob.patp(p);
    console.log(`${patp} (${p})`);
  }
}


