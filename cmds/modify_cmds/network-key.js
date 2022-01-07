const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth} = require('../../utils')
const modifyCommon = require('./common')

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

  const wallets = argv.useWalletFiles ? modifyCommon.getWallets(workDir) : null;
  const points = modifyCommon.getPoints(argv, workDir, wallets);

  console.log(`Will set network keys for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set network key for ${patp} (${p}).`);

    //retrieve the network keypair
    // TODO: support other sources for the netork key pair than a wallet file
    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    if(!wallet){
      console.log(`Wallet not found for ${patp}, can only set keys based on walled file.`);
      continue;
    }
    let networkKeyPair = wallet.network.keys;


    var res = await ajs.check.canConfigureKeys(ctx.contracts, p, ethAccount.address);
    if(!res.result){
        console.log(`Cannot set network key for ${patp}: ${res.reason}`);
        continue;
    }

    //we are using the public keys because in the contract only the public keys should be visible, the private keys are used to generate the arvo key file
    var publicCrypt = ajs.utils.addHexPrefix(networkKeyPair.crypt.public);
    var publicAuth = ajs.utils.addHexPrefix(networkKeyPair.auth.public);

    var existingKeys = await ajs.azimuth.getKeys(contracts, point);

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
    await modifyCommon.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'networkkey');
  } //end for each point
  
  process.exit(0);
};

const CRYPTO_SUITE_VERSION = 1;






