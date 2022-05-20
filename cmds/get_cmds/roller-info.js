const {rollerApi} = require('../../utils')

exports.command = 'roller-info'
exports.desc = 'Outputs information about the roller, including next batch time.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  const rollerClient = rollerApi.createClient(argv);

  const rollerConfig = await rollerApi.getRollerConfig(rollerClient);
  console.log(`roller config:`);
  console.log(JSON.stringify(rollerConfig, null, 2));

  const nextBatchTime = getNextBatchTime(rollerConfig);
  console.log(`next batch: ${nextBatchTime} GMT`);
}

function getNextBatchTime(rollerConfig){
  var date = new Date(rollerConfig.nextBatch * 1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();
  var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  return formattedTime;
}