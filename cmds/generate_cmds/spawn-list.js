const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const ajsHelpers = require('../../utils/azimuth-helpers')
const context = require('../../cli-context')
const validate = require('../../utils/validate')
const wd = require('../../utils/work-dir')

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
  yargs.option('file-name',{
    describe: 'The file name of the spawn list.',
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
}

exports.handler = async function (argv) 
{
  const point = validate.point(argv.point, true);
  const workDir = wd.ensureWorkDir(argv.workDir);
 
  if(wd.fileExists(workDir, argv.fileName) && !argv.force)
  {
    console.log('Spawn list file already exists, will not recreate it.');
    return;
  }

  const ctx = await context.createContext(argv);
  var childPoints = await ajsHelpers.getUnspawnedChildren(ctx.contracts, point);

  var spawnList = pickChildPoints(childPoints, argv.count, argv.pick);
  var spawnListPatp = _.map(spawnList, p => ob.patp(p));

  const filePath = wd.writeFile(workDir, argv.fileName, spawnListPatp);
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

