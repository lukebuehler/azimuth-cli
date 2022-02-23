const ajs = require('azimuth-js')
const ob = require('urbit-ob')
const {validate, eth, rollerApi} = require('../../utils')

exports.command = 'test'
exports.desc = 'L2 workbench command.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  
  const p = Number(ob.patp2dec("~sardys"));

  const rollerClient = rollerApi.createClient();
  var pointInfo = await rollerApi.getPoint(rollerClient, "~sardys");
  console.log(pointInfo);
  
  console.log("Done");

  //const point = await roller.getPoint(p);
  //console.log(point);

  // Signing:
  //const hash = roller.prepareForSigning(12,...)
  //or
  //  const hash = await roller.getUnsignedTx(nonce, from, type, data);
  // // const sig = await signTransactionHash(hash, wallet.privateKey); //see authToken.ts

  // console.log(resp);
  // console.log("Here");
}