const ajs = require('azimuth-js')
const ob = require('urbit-ob')
const {validate, eth, rollerApi} = require('../../utils')

exports.command = 'test'
exports.desc = 'L2 workbench command.'
exports.builder = (yargs) =>{
  yargs.demandOption('private-key');
}

exports.handler = async function (argv) {
  
  const privateKey = await eth.getPrivateKey(argv);

  const rollerClient = rollerApi.createClient();

  // const p = Number(ob.patp2dec("~sardys"));

  // 
  // var pointInfo = await rollerApi.getPoint(rollerClient, "~sardys");
  // console.log(pointInfo);
  
  // console.log("Get point, done");


  var spawnedPoint = await rollerApi.spawn(
    rollerClient, "~sardys", "~ripwyt-rilfep", 
    "0x1234", "0x1234",
    privateKey);
  console.log(spawnedPoint);
  console.log("Spawn, done");
}