const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const ajsHelpers = require('../../utils/azimuth-helpers')
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
  const childPoints = await ajsHelpers.getUnspawnedChildren(ctx.contracts, point);
  console.log(`listing ${childPoints.length} unspawned children under ${ob.patp(point)} (${point}):`);
  for(const p of childPoints)
  {
    const patp = ob.patp(p);
    const isSpawned = false;
    console.log(`${patp}, ${p}, ${isSpawned}`);
  }
}

