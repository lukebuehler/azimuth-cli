const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth} = require('../../utils')
const modifyCommon = require('./common')

exports.command = 'transfer'
exports.desc = 'Transfer one or more points, either to the wallet address or to the provided target addess.'

exports.builder = function(yargs) {
  yargs.option('reset-network-key',{
    describe: 'If the network key should be reset in the process of the transfer. Do not set to true when moving to a HD wallet address.',
    default: false,
    type: 'boolean',
  });
}

exports.handler = async function (argv)
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const privateKey = await eth.getPrivateKey(argv);
  const ctx = await eth.createContext(argv);
  const ethAccount = eth.getAccount(ctx.web3, privateKey);

  const wallets = argv.useWalletFiles ? modifyCommon.getWallets(workDir) : null;
  const points = modifyCommon.getPoints(argv, workDir, wallets);

  console.log(`Will transfer ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to transfer ${patp} (${p}).`);
    
    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    let targetAddress = 
      argv.address != undefined
      ? argv.address 
      : argv.useWalletFiles 
      ? wallet.ownership.keys.address :
      null; //fail
    targetAddress = validate.address(targetAddress, true);

    let isOwner = ajs.azimuth.isOwner(ctx.contracts, p, targetAddress);
    if(isOwner){
      console.log(`Target address ${targetAddress} is already owner of ${patp}.`);
      continue;
    }

    var res = await ajs.check.canTransferPoint(ctx.contracts, p, ethAccount.address, targetAddress);
    if(!res.result){
        console.log(`Cannot transfer ${patp}: ${res.reason}`);
        continue;
    }

    //create and send tx
    let tx = ajs.ecliptic.transferPoint(ctx.contracts, p, targetAddress, argv.resetNetworkKey);
    await modifyCommon.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'transfer');
  } //end for each point
  
  process.exit(0);
};








