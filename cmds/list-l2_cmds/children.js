const ob = require('urbit-ob')
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
  const rollerClient = rollerApi.createClient();

  let childPoints = null;
  if(argv.spawned){
    childPoints = await rollerApi.getSpawned(rollerClient, point);
  }
  else if(argv.unspawned){
    childPoints = await rollerApi.getUnspawned(rollerClient, point);
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


