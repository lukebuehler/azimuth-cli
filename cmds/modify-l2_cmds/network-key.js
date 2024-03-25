const ob = require('urbit-ob')
const _ = require('lodash')
const ajsUtils = require('azimuth-js').utils;
var Accounts = require('web3-eth-accounts');
const {files, validate, eth, findPoints, rollerApi} = require('../../utils')

exports.command = 'network-key'
exports.desc = 'Set the network key for one or more L2 points.'

exports.builder = function(yargs) {
  yargs.option('breach',{
    describe: 'Do a factory reset of the ship.',
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

  console.log(`Will set network keys for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set network key for ${patp} (${p}).`);

    const pointInfo = await rollerApi.getPoint(rollerClient, patp);
    if(pointInfo.dominion != 'l2'){
      console.log(`This point in not on L2, please use the L1 modify command.`);
      continue;
    }
    
    const currentKeys = pointInfo.network.keys;

    //retrieve the network keypair
    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    const currentRevision = currentKeys.life; //network key revision number == life.
    const revision = currentRevision;
    const keysFileName = `${patp.substring(1)}-networkkeys-${revision}.json`;
    
    let networkKeyPair = null;
    if(wallet){
      networkKeyPair = wallet.network.keys;
    }
    else if(files.fileExists(workDir, keysFileName)){
      networkKeyPair = files.readJsonObject(workDir, keysFileName);
    }
    else{
      console.error(`Could not find network keys for ${patp}: provide them either via wallet or network key file.`);
      process.exit(1);
    }

    if(!(await rollerApi.canConfigureKeys(rollerClient, patp, signingAddress))){
      console.log(`Cannot set network keys for ${patp}, must be owner or management proxy.`);
      continue;
    }

    //we are using the public keys because in the contract only the public keys should be visible, the private keys are used to generate the arvo key file
    var publicCrypt = ajsUtils.addHexPrefix(networkKeyPair.crypt.public);
    var publicAuth = ajsUtils.addHexPrefix(networkKeyPair.auth.public);

    if(currentKeys.crypt == publicCrypt && currentKeys.auth == publicAuth)
    {
        console.log(`The network key is already set for ${patp}`);
        // console.log(JSON.stringify(networkKeyPair, null, 2));
        // console.log(JSON.stringify(currentKeys, null, 2));
        continue;
    }

    var receipt = await rollerApi.configureKeys(rollerClient, patp, publicCrypt, publicAuth, argv.breach, signingAddress, privateKey);
    console.log("Tx hash: "+receipt.hash);

    let receiptFileName = patp.substring(1)+`-receipt-L2-${receipt.type}.json`;
    files.writeFile(workDir, receiptFileName, receipt);
  } //end for each point
  
  process.exit(0);
};







