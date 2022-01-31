const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth, azimuth} = require('../../utils')
const modifyCommon = require('./common')

exports.command = 'management-proxy'
exports.desc = 'Set the management proxy of one or more points.'

exports.builder = function(yargs) {
}

exports.handler = async function (argv)
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const privateKey = await eth.getPrivateKey(argv);
  const ctx = await eth.createContext(argv);
  const ethAccount = eth.getAccount(ctx.web3, privateKey);

  const wallets = argv.useWalletFiles ? modifyCommon.getWallets(workDir) : null;
  const points = modifyCommon.getPoints(argv, workDir, wallets);

  console.log(`Will set mgmt. proxy for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set mgmt. proxy for ${patp} (${p}).`);

    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    let targetAddress = 
      argv.address != undefined
      ? argv.address 
      : argv.useWalletFiles 
      ? wallet.management.keys.address :
      null; //fail
    targetAddress = validate.address(targetAddress, true);

    if(await azimuth.isManagementProxy(ctx.contracts, p, targetAddress)){
      console.log(`Target address ${targetAddress} is already mgmt. proxy for ${patp}.`);
      continue;
    }

    var res = await ajs.check.canSetManagementProxy(ctx.contracts, p, ethAccount.address);
    if(!res.result){
      console.log(`Cannot set mgmt. proxy for ${patp}: ${res.reason}`);
      continue;
    }

    //create and send tx
    let tx = ajs.ecliptic.setManagementProxy(ctx.contracts, p, targetAddress)
    await modifyCommon.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'managementproxy');
  } //end for each point
  
  process.exit(0);
};







