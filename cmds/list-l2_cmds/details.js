const ob = require('urbit-ob')
const {validate, rollerApi} = require('../../utils')

exports.command = 'details <point>'
exports.desc = 'Outputs various information about a <point> retrieved from a roller.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  const p = validate.point(argv.point, true);
  const patp = ob.patp(p);
  console.log(`urbit ID (patp): ${patp}`);
  console.log(`urbit ID number (p): ${p}`);

  const rollerClient = rollerApi.createClient(argv);
  const pointInfo = await rollerApi.getPoint(rollerClient, p);
  console.log(`data from roller:`);
  console.log(JSON.stringify(pointInfo, null, 2));

}