const ob = require('urbit-ob')
const _ = require('lodash')
const ajsUtils = require('azimuth-js').utils;
var Accounts = require('web3-eth-accounts');
const {files, validate, eth, findPoints, rollerApi} = require('../../utils')

exports.command = 'management-proxy'
exports.desc = 'Set the management proxy of one or more L2 points.'

exports.builder = function(yargs) {
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

  console.log(`Will set mgmt. proxy for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set mgmt. proxy for ${patp} (${p}).`);

    const pointInfo = await rollerApi.getPoint(rollerClient, patp);
    if(pointInfo.dominion != 'l2'){
      console.log(`This point in not on L2, please use the L1 modify command.`);
      continue;
    }

    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    let targetAddress = 
      argv.address != undefined
      ? argv.address 
      : argv.useWalletFiles 
      ? wallet.management.keys.address :
      null; //fail
    targetAddress = validate.address(targetAddress, true);

    if(ajsUtils.addressEquals(pointInfo.ownership.managementProxy.address, targetAddress)){
      console.log(`Target address ${targetAddress} is already mgmt. proxy for ${patp}.`);
      continue;
    }

    if(!(await rollerApi.isOwner(rollerClient, patp, signingAddress))) {
      console.log(`Cannot set mgmt. proxy for ${patp}, must be owner.`);
      continue;
    }

    //create and send tx
    var receipt = await rollerApi.setManagementProxy(rollerClient, patp, targetAddress, signingAddress, privateKey);
    console.log("Tx hash: "+receipt.hash);

    let receiptFileName = patp.substring(1)+`-receipt-L2-${receipt.type}.json`;
    files.writeFile(workDir, receiptFileName, receipt);
  } //end for each point
  
  process.exit(0);
};







