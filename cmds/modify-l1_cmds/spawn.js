const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth, findPoints} = require('../../utils')

exports.command = 'spawn'
exports.desc = 'Spawn one or more points, where the points are patp or p. Can also provide the points to spawn via files. See options.'

exports.builder = function(yargs) {
  yargs.demandOption('address');
}

exports.handler = async function (argv)
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const privateKey = await eth.getPrivateKey(argv);

  const ctx = await eth.createContext(argv);
  const ethAccount = eth.getAccount(ctx.web3, privateKey);

  const wallets = argv.useWalletFiles ? findPoints.getWallets(workDir) : null;
  const points = findPoints.getPoints(argv, workDir, wallets);

  //for spawning points, we do not allow it to be spawned directly to the ownership address of the master ticket, even if useWalletFiles is set.
    // the reason for this is that it would require accepting the transfer, and usually HD wallets do not have any ETH on the ownership address to do that.
    // so, the best way of spawning is to spwan to an address with eth (usually the same as the ownership of the parent or spawn proxy of parent), so more things can be set, such as the netork key.
  const targetAddress = validate.address(argv.address, true);

  console.log(`Will spawn ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to spawn ${patp} (${p}).`);

    var res = await ajs.check.canSpawn(ctx.contracts, p, ethAccount.address);
    if(!res.result){
        console.log(`Cannot spawn ${patp}: ${res.reason}`);
        return;
    }

    //create and send tx
    let tx = ajs.ecliptic.spawn(ctx.contracts, p, targetAddress);
    await eth.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'spawn');
  } //end for each point
  
  //with web3, sometimes the not all promises complete which keeps the process hanging
  // since we completed the handler, we can exit
  process.exit(0);
};






