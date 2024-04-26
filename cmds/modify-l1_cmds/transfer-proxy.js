const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth, azimuth, findPoints} = require('../../utils')

exports.command = 'transfer-proxy'
exports.desc = 'Set the transfer proxy of one or more points.'

exports.builder = function(yargs) {
}

exports.handler = async function (argv)
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const privateKey = await eth.getPrivateKey(argv);
  const ctx = await eth.createContext(argv);
  const ethAccount = eth.getAccount(ctx.web3, privateKey);

  const wallets = argv.useWalletFiles ? findPoints.getWallets(workDir) : null;
  const points = findPoints.getPoints(argv, workDir, wallets);

  console.log(`Will set transfer proxy for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set transfer proxy for ${patp} (${p}).`);

    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    let targetAddress = 
      argv.address != undefined
      ? argv.address 
      : argv.useWalletFiles 
      ? wallet.ownership.keys.address :
      null; //fail
    targetAddress = validate.address(targetAddress, true);

    if(await azimuth.isTransferProxy(ctx.contracts, p, targetAddress)){
      console.log(`Target address ${targetAddress} is already transfer proxy for ${patp}.`);
      continue;
    }

    var res = await ajs.check.canSetTransferProxy(ctx.contracts, p, ethAccount.address);
    if(!res.result){
      console.log(`Cannot set transfer proxy for ${patp}: ${res.reason}`);
      continue;
    }

    //create and send tx
    let tx = ajs.ecliptic.setTransferProxy(ctx.contracts, p, targetAddress)
    await eth.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'transferproxy');
  } //end for each point
  
  process.exit(0);
};
