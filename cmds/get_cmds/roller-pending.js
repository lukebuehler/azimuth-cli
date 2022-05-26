const ob = require('urbit-ob')
const {validate, rollerApi} = require('../../utils')

exports.command = 'roller-pending'
exports.desc = 'Outputs the pending roller transactions.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  const rollerClient = rollerApi.createClient(argv);
  const data = await rollerApi.getAllPending(rollerClient);
  console.log(`data from roller:`);
  console.log(JSON.stringify(data, null, 2));
}