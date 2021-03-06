const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth, findPoints} = require('../../utils')

exports.command = 'spawn-proxy'
exports.desc = 'Set the spawn proxy of one or more points.'

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

  console.log(`Will set spawn proxy for ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to set spawn proxy for ${patp} (${p}).`);
    
    let shipClass = ob.clan(patp);
    if(shipClass != 'galaxy' && shipClass != 'star'){
      console.log(`Can only set spawn proxy for galaxies and stars, ${patp} is a ${shipClass}. Will skip it.`);
      continue;
    }

    let wallet = argv.useWalletFiles ? wallets[patp] : null;
    let targetAddress = 
      argv.address != undefined
      ? argv.address 
      : argv.useWalletFiles 
      ? wallet.spawn.keys.address :
      null; //fail
    targetAddress = validate.address(targetAddress, true);

    let currentSpawnProxy = await ajs.azimuth.getSpawnProxy(ctx.contracts, p);
    if(currentSpawnProxy == targetAddress){
      console.log(`Target address ${targetAddress} is already spawn proxy for ${patp}.`);
      continue;
    }

    var res = await ajs.check.canSetSpawnProxy(ctx.contracts, p, ethAccount.address);
    if(!res.result){
        console.log(`Cannot set spawn proxy for ${patp}: ${res.reason}`);
        continue;
    }

    //create and send tx
    let tx = ajs.ecliptic.setSpawnProxy(ctx.contracts, p, targetAddress)
    await eth.setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, 'spawnproxy');
  } //end for each point
  
  process.exit(0);
};








