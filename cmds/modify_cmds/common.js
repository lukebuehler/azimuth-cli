const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth} = require('../../utils')

function getWallets(workDir){
  let walletFiles = files.getFiles(workDir);
  walletFiles = _.filter(walletFiles, f=>f.endsWith('-wallet.json'));
  let wallets = {};
  for (const walletFile of walletFiles) 
    {
      let wallet = files.readJsonObject(walletFile);
      wallets[wallet.meta.ship] = wallet;
    }
  return wallets;
}

function getPoints(argv, workDir, wallets){
  let pointsRaw = [];
  if(argv.points){
    pointsRaw = argv.points;
  }
  else if(argv.file){
    pointsRaw = files.readLines(workDir, argv.file);
  }
  else if(argv.useWalletFiles){
    //wallets is an object with the keys being the p
    pointsRaw = Object.keys(wallets);
  }
  let points = _(pointsRaw)
    .map(point => validate.point(point, false))
    .reject(_.isNull)
    .value();

  if(!points || points.length == 0){
    console.error('No points provided or found.');
    process.exit(1);
  }
  return points;
}

async function yargsHandler(argv, action, name, checkFunction, modifyFunction)
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const privateKey = await eth.getPrivateKey(argv);
  const ctx = await eth.createContext(argv);
  const ethAccount = eth.getAccount(ctx.web3, privateKey);

  const targetAddress = validate.address(argv.address, true);

  const wallets = argv.useWalletFiles ? getWallets(workDir) : null;
  const points = getPoints(argv, workDir, wallets);

  //for each point, try to spawn it to the target address
  console.log(`Will ${action} ${points.length} points`);
  for (const p of points) 
  {
    let patp = ob.patp(p);
    console.log(`Trying to ${action} ${patp} (${p}).`);

    var res = await checkFunction(ctx.contracts, p, ethAccount.address);
    if(!res.result){
        console.log(`Cannot ${action} ${patp}: ${res.reason}`);
        return;
    }

    //create and send tx
    let wallet = argv.useWalletFiles ? wallets[p] : null;
    let tx = modifyFunction(ctx.contracts, p, argv, wallet);
    eth.setGas(tx, argv);
    //console.log(JSON.stringify(tx, null, 2));
    var signedTx = null;
    try{
      signedTx = await eth.signAndSend(ctx.web3, tx, privateKey);
    }
    catch(err){
      console.log('Could not send transaction to the blockchain:');
      console.log(err);
      process.exit(1);
    }
    let receipt = await eth.waitForTransactionReceipt(ctx.web3, signedTx);
    //save the reciept if the transacation was accepted
    // status will be false if the blockchain rejected the transaction
    if(receipt != null && receipt.status){
      let receiptFileName = patp.substring(1)+`-reciept-${name}.json`;
      files.writeFile(workDir, receiptFileName, receipt);
      console.error("Transaction accepted by the blockchain.")
    }
    else{
      console.error("Transaction did not succeed.")
      if(!receipt.logs){
        console.error(receipt.logs)
      }
    }
  } //end for each point
  
  //with web3, sometimes the not all promises complete which keeps the process hanging
  // since we completed the handler, we can exit
  process.exit(0);
}

async function setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, actionName){
  eth.setGas(tx, argv);
  //console.log(JSON.stringify(tx, null, 2));
  var signedTx = null;
  try{
    signedTx = await eth.signAndSend(ctx.web3, tx, privateKey);
  }
  catch(err){
    console.log('Could not send transaction to the blockchain:');
    console.log(err);
    process.exit(1);
  }
  let receipt = await eth.waitForTransactionReceipt(ctx.web3, signedTx);
  //save the reciept if the transacation was accepted
  // status will be false if the blockchain rejected the transaction
  if(receipt != null && receipt.status){
    let receiptFileName = patp.substring(1)+`-reciept-${actionName}.json`;
    files.writeFile(workDir, receiptFileName, receipt);
    console.error("Transaction accepted by the blockchain.")
  }
  else{
    console.error("Transaction did not succeed.")
    if(!receipt.logs){
      console.error(receipt.logs)
    }
  }
}

module.exports = {
  getWallets,
  getPoints,
  setGasSignSendAndSaveTransaction
}



