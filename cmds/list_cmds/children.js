const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const context = require('../../cli-context')
const validate = require('../../utils/validate')

exports.command = 'children <point>'
exports.desc = 'List children for <point>, where <point> is patp or p.'
exports.builder = (yargs) =>{
  //yargs.demandOption('point')
}

exports.handler = async function (argv) {
  const point = validate.point(argv.point, true);
  const ctx = await context.createContext(argv);
  await listChildPoints(ctx, point);
}

async function listChildPoints(ctx, point)
{
  const childPoints = await getUnspawnedChildren(ctx.contracts, point);
  console.log(`listing ${childPoints.length} unspawned children under ${ob.patp(point)} (${point}):`);
  for(const p of childPoints)
  {
    const patp = ob.patp(p);
    const isSpawned = false;
    console.log(`${patp}, ${p}, ${isSpawned}`);
  }
}

//this function is copied here from azimuth-js
//here is the issue: https://github.com/urbit/azimuth-js/issues/80
async function getUnspawnedChildren(contracts, point) {
  let size = ajs.azimuth.getPointSize(point);
  if (size >= ajs.azimuth.PointSize.Planet) {
    return [];
  }
  //this is an array of strings (not sure why, it shouldn't be)
  let spawned = await ajs.azimuth.getSpawned(contracts, point);
  // console.log(spawned);
  let unspawned = [];
  let childSpace = (size === ajs.azimuth.PointSize.Galaxy) ? 0x100 : 0x10000;
  for (let i = 1; i < childSpace; i++) {
    let child = point + (i*childSpace);
    //then this comparison fails unless child is cast to string
    if (spawned.indexOf(child.toString()) < 0) {
      unspawned.push(child);
    }
  }
  return unspawned;
}