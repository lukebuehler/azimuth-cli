const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth, findPoints} = require('../../utils')

exports.command = 'network-key'
exports.desc = 'Set the network key for one or more points.'

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

  console.log(`Will set network keys for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set network key for ${patp} (${p}).`);

    //retrieve the network keypair
    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    const revision = 1; //TODO: support bumping the revision (by looking it up on-chain)
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

    var res = await ajs.check.canConfigureKeys(ctx.contracts, p, ethAccount.address);
    if(!res.result){
        console.log(`Cannot set network key for ${patp}: ${res.reason}`);
        continue;
    }

    //we are using the public keys because in the contract only the public keys should be visible, the private keys are used to generate the arvo key file
    var publicCrypt = ajs.utils.addHexPrefix(networkKeyPair.crypt.public);
    var publicAuth = ajs.utils.addHexPrefix(networkKeyPair.auth.public);

    var existingKeys = await ajs.azimuth.getKeys(ctx.contracts, p);
    if(existingKeys.crypt == publicCrypt && existingKeys.auth == publicAuth)
    {
        console.log(`The network key is already set for ${patp}`);
        // console.log(JSON.stringify(networkKeyPair, null, 2));
        // console.log(JSON.stringify(existingKeys, null, 2));
        continue;
    }

    // Create and Send Tx
    let tx = ajs.ecliptic.configureKeys(
        ctx.contracts, 
        p, 
        publicCrypt, 
        publicAuth,
        CRYPTO_SUITE_VERSION,
        false);
    await eth.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'networkkey');
  } //end for each point
  
  process.exit(0);
};

const CRYPTO_SUITE_VERSION = 1;






