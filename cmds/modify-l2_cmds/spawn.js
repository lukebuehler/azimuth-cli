const ob = require('urbit-ob')
const _ = require('lodash')
var Accounts = require('web3-eth-accounts');
const {files, validate, eth, findPoints, rollerApi} = require('../../utils')

exports.command = 'spawn'
exports.desc = 'Spawn one or more points on L2, where the points are patp or p. Can also provide the points to spawn via files. See options.'

exports.builder = function(yargs) {
  yargs.demandOption('address');
  //yargs.demandOption('signing-address');
}

exports.handler = async function (argv)
{
  const rollerClient = rollerApi.createClient(argv);
  const workDir = files.ensureWorkDir(argv.workDir);
  const privateKey = await eth.getPrivateKey(argv);
  const account = new Accounts().privateKeyToAccount(privateKey);
  const signingAddress = account.address;

  const wallets = argv.useWalletFiles ? findPoints.getWallets(workDir) : null;
  const points = findPoints.getPoints(argv, workDir, wallets);

  //for spawning points, we do not allow it to be spawned directly to the ownership address of the master ticket, even if useWalletFiles is set.
  // .. at least not yet
  const targetAddress = validate.address(argv.address, true);

  console.log(`Will spawn ${points.length} points`);
  for (const p of points) 
  {
    const patp = ob.patp(p);
    console.log(`Trying to spawn ${patp} (${p}).`);

    const parentPoint = ob.sein(patp);
    const parentPointInfo = await rollerApi.getPoint(rollerClient, parentPoint);
    
    if(parentPointInfo.dominion == 'l1') {
      console.log(`The parent, ${parentPoint}, of this point, ${patp}, cannont spawn on L2, please transfer it to L2 or set the spawn proxy to L2.`);
      continue;
    }
    if (!(await rollerApi.canSpawn(rollerClient, parentPoint, signingAddress))) {
      console.log(`Cannot spawn ${patp} from ${parentPoint}, must be owner or spawn proxy.`);
      continue;
    }

    // console.log("parent p: "+parentPoint);
    // console.log("p to spawn: "+p);
    // console.log("targetAddress: "+targetAddress);
    // console.log("signingAddress: "+signingAddress);
    // console.log("privateKey: "+privateKey);
    var receipt = await rollerApi.spawn(rollerClient, parentPoint, patp, targetAddress, signingAddress, privateKey);
    console.log("Tx hash: "+receipt.hash);

    let receiptFileName = patp.substring(1)+`-receipt-L2-${receipt.type}.json`;
    files.writeFile(workDir, receiptFileName, receipt);
  } //end for each point
  
  process.exit(0);
};






