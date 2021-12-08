const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth} = require('../../utils')

exports.command = 'spawn'
exports.desc = 'Spawn one or more points, where the points are patp or p. Can also provide the points to spawn via files. See options.'
exports.builder = (yargs) =>{
  yargs.demandOption('d');
  yargs.demandOption('a');

  yargs.option('file',{
    describe: 'A file containing the points to spawn with each point on a separate line, can be p or patp.',
    type: 'string',
    conflicts: 'points'
  });
  yargs.option('points',{
    alias: ['p', 'point'],
    describe: 'One or more points to spawn, can be p or patp.',
    type: 'array',
    conflicts: 'file'
  });
  yargs.check(argv => {
    if (!argv.file && !argv.points) throw new Error('You must provide either --file or --points')
    return true
  });
}

exports.handler = async function (argv) 
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const targetAddress = validate.address(argv.address, true);
  const privateKey = eth.getPrivateKey(argv);
  const ctx = await eth.createContext(argv);
  const ethAccount = eth.getAccount(ctx.web3, privateKey);

  //parse the points
  const pointsRaw = argv.points ?? files.readLines(workDir, argv.file);
  let points = _(pointsRaw)
    .map(point => validate.point(point, false))
    .reject(_.isNull)
    .value();

  if(!points || points.length == 0){
    console.error('No points provided.');
    process.exit(1);
  }

  //for each point, try to spawn it to the target address
  console.log(`Will spawn ${points.length} points to ${targetAddress}`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to spawn ${patp} (${p}).`);
    //the address of the private key must be the parent point owner or spawn proxy
    var res = await ajs.check.canSpawn(ctx.contracts, p, ethAccount.address);
    if(!res.result){
        console.log(`cannot spawn ${patp}: ${res.reason}`);
        return;
    }

    //create and send tx
    let tx = ajs.ecliptic.spawn(ctx.contracts, p, targetAddress);
    eth.setGas(tx, argv);
    let signedTx = await eth.signAndSend(ctx.web3, tx, privateKey);
    let receipt =  await eth.waitForTransactionReciept(signedTx);

    //save the reciept if the transacation was accepted
    // status will be false if the blockchain rejected the transaction
    if(reciept && reciept.status){
      let receiptFileName = patp.substring(1)+'-reciept-spawn.json';
      files.writeFile(workDir, receiptFileName, reciept);
    }
    else{
      console.error("transaction did not succeed.")
      if(!receipt.logs){
        console.error(receipt.logs)
      }
    }
  }
}






