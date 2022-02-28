const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth, rollerApi} = require('../../utils')

exports.command = 'spawn-list <point>'
exports.desc = 'Create a list of child points to spawn from <point>. If the file already exists, this command will be a no-op.'
exports.builder = (yargs) =>{
  yargs.demandOption('d');
  yargs.option('count',{
    alias: 'c',
    describe: 'How many child points to add to the list.',
    default: 1,
    type: 'number',
  });
  yargs.option('output',{
    alias: 'o',
    describe: 'The output file name of the spawn list.',
    default: 'spawn-list.txt',
    type: 'string',
  });
  yargs.option('force',{
    alias: 'f',
    describe: 'Force override the file if it already exists.',
    default: false,
    type: 'boolean',
  });
  yargs.option('pick',{
    choices: ['random', 'first', 'last'],
    describe: 'How to pick the child points from the entire list of unspawned child points.',
    default: 'random',
    type: 'string',
  });

  //todo: remove this and figure out the dominion pased on the parent point
  yargs.option('use-roller',{
    alias: 'l2',
    describe: 'Connect to a roller to get the unspawned points instead of azimuth.',
    type: 'boolean',
  });
}

exports.handler = async function (argv) 
{
  const point = validate.point(argv.point, true);
  const workDir = files.ensureWorkDir(argv.workDir);
 
  if(files.fileExists(workDir, argv.output) && !argv.force)
  {
    console.log('Spawn list file already exists, will not recreate it.');
    return;
  }

  let childPoints = [];
  if(!argv.useRoller){
    const ctx = await eth.createContext(argv);
    childPoints = await ajs.azimuth.getUnspawnedChildren(ctx.contracts, point);
  }
  else{
    const rollerClient = rollerApi.createClient(argv);
    childPoints = await rollerApi.getUnspawned(rollerClient, point);
  }

  var spawnList = pickChildPoints(childPoints, argv.count, argv.pick);
  var spawnListPatp = _.map(spawnList, p => ob.patp(p));

  const filePath = files.writeFile(workDir, argv.output, spawnListPatp);
  console.log(`Spawn list for ${spawnList.length} point(s) written to ${filePath}`)
}

function pickChildPoints(childPoints, count, pick){
  switch(pick)
  {
    case 'first':
      return childPoints.slice(0, count);
    case 'last':
      return childPoints.slice(count*-1);
    case 'random':
    default:
      return _.sampleSize(childPoints, count);
  }
}

