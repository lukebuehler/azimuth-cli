const ob = require('urbit-ob')
const _ = require('lodash')
const ajsUtils = require('azimuth-js').utils;
var Accounts = require('web3-eth-accounts');
const {files, validate, eth, findPoints, rollerApi} = require('../../utils')

exports.command = 'transfer'
exports.desc = 'Transfer one or more L2 points, either to the wallet address or to the provided target addess.'

exports.builder = function(yargs) {
  yargs.option('reset',{
    describe: 'If the network keys and proxies should be reset in the process of the transfer. Do not set to true when moving to a HD wallet address.',
    default: false,
    type: 'boolean',
  });
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
      null; // fail
    targetAddress = validate.address(targetAddress, true);

    let pointInfo = await rollerApi.getPoint(rollerClient, patp);

    if(pointInfo.dominion != 'l2') {
      console.log(`This point in not on L2, please use the L1 modify command.`);
      continue;
    }
    if(ajsUtils.addressEquals(pointInfo.ownership.owner.address, targetAddress)) {
      console.log(`Target address ${targetAddress} is already owner of ${patp}.`);
      continue;
    }
    if(!(await rollerApi.canTransfer(rollerClient, patp, signingAddress))) {
      console.log(`Signing address ${signingAddress} must be owner or transfer proxy to transfer ${patp}.`);
      continue;
    }    

    // create and send tx
    var receipt = await rollerApi.transferPoint(rollerClient, patp, argv.reset, targetAddress, signingAddress, privateKey);
    console.log("Tx hash: "+receipt.hash);

    let receiptFileName = patp.substring(1)+`-receipt-L2-${receipt.type}.json`;
    files.writeFile(workDir, receiptFileName, receipt);
  } // end for each point
  
  process.exit(0);
};








