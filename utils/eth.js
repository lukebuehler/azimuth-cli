const Web3 = require('web3')
const ajs = require('azimuth-js')
const files = require('./files')
const {Accounts} = require('web3-eth-accounts');
const { env } = require('yargs');

function initWeb3(argv)
{
  if(argv.useMainnet){
    console.log('! RUNNING ON MAINNET !');
  }
  let providerUrl = 
    argv.ethProvider == 'mainnet' 
    ? argv.ethProviderMainnet 
    : argv.ethProvider == 'ropsten' 
    ? argv.ethProviderRopsten 
    : argv.ethProviderGanache;
  
  let provider = new Web3.providers.HttpProvider(providerUrl);
  let web3 = new Web3(provider);
  web3.eth.handleRevert = true;
  return web3;
}

async function initContracts(argv, web3)
{
  const ganacheContract = '0x863d9c2e5c4c133596cfac29d55255f0d0f86381';
  const ropstenContract = ajs.chainDetails.ropsten.azimuth.address;
  const mainnetContract = ajs.chainDetails.mainnet.azimuth.address;
  var azAddress = 
    argv.ethProvider == 'mainnet' 
    ? mainnetContract 
    : argv.ethProvider == 'ropsten' 
    ? ropstenContract 
    : ganacheContract;
  contracts = await ajs.initContractsPartial(web3, azAddress);
  return contracts;
}

async function createContext(argv)
{
  let web3 = initWeb3(argv);
  let contracts = await initContracts(argv, web3);
  return {
    web3: web3,
    contracts: contracts,
  }
}

async function getPrivateKey(argv){
  let pk = null;
  //retrieve the pk depending on the provided arguments
  if(argv.privateKey){
    pk = argv.privateKey;
  }
  if(argv.privateKeyFile){
    pk = files.readLines('', argv.privateKeyFile).find(x=>!x);//get the first non-empty line
  }
  else if(argv.privateKeyWalletFile){
    let wallet = files.readJsonObject('', argv.privateKeyWalletFile);
    pk = wallet.ownership.keys.private;
  }
  else if(argv.privateKeyTicket){
    const kg = require('urbit-key-generation');
    let wallet = await kg.generateWallet({
      ticket: argv.privateKeyTicket,
      ship: 0, //we just use the wallet code to derrive the pk, ship is not used
      boot: false,
      revision: 1
    });
    pk = wallet.ownership.keys.private;
  }
  if(!pk){
    console.error("Could not retrieve private key from the arguments, please provide it.");
    process.exit(1);
  }
  //remove hex prefix if there is one
  pk = ajs.utils.stripHexPrefix(pk);
  //validate
  if(!ajs.utils.isValidPrivate(Buffer.from(pk, 'hex')))
  {
    console.error("Private key is not valid.");
    process.exit(1);
  }
  return pk;
}

//returns: https://web3js.readthedocs.io/en/v1.2.0/web3-eth-accounts.html#privatekeytoaccount
function getAccount(web3, privateKey){
  return web3.eth.accounts.privateKeyToAccount(privateKey, false);
}

async function getCurrentGasPrices() {
  const axios = require('axios');
  let response = await axios.get('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
  return response.data.result;
}

function setGas(tx, argv)
{
  if(argv.gas)
  {
    tx.gas = argv.gas; //in gwei
  }
  if(argv.gasLimit)
  {
    tx.gasLimit = argv.gasLimit; //in gwei
  }
  if(argv.maxFee)
  {
    tx.maxFeePerGas = Web3.utils.toWei(argv.maxFee, 'gwei'); //in wei
  }
  if(argv.maxPriorityFee)
  {
    tx.maxPriorityFeePerGas = Web3.utils.toWei(argv.maxPriorityFee, 'gwei'); //in wei
  }
}

async function signAndSend(web3, tx, pk){

  let pkBuffer = Buffer.from(pk, 'hex');
  if(!ajs.utils.isValidPrivate(pkBuffer))
      throw 'pk is not valid';

  // Sign and Send Tx
  let txSigned = await ajs.txn.signTransaction(web3, tx, pkBuffer);
  console.log('signed transaction: ' + txSigned.transactionHash);
  //console.log(JSON.stringify(txSigned, null, 2));
  console.log('sending transaction...');
  await ajs.txn.sendSignedTransaction(web3, txSigned);
  console.log('sent transaction: ' + txSigned.transactionHash);

  return txSigned;
}

async function waitForTransactionReceipt(web3, txSigned)
{
    const transactionHash = txSigned.transactionHash;
    let receipt;
    while(!(receipt = await web3.eth.getTransactionReceipt(transactionHash)))
    {
        console.log(`no transaction receipt yet...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
    }
    return receipt;
}

async function setGasSignSendAndSaveTransaction(ctx, tx, privateKey, argv, workDir, patp, actionName){
  setGas(tx, argv);
  //console.log(JSON.stringify(tx, null, 2));
  var signedTx = null;
  try{
    signedTx = await signAndSend(ctx.web3, tx, privateKey);
  }
  catch(err){
    console.log('Could not send transaction to the blockchain:');
    console.log(err);
    process.exit(1);
  }
  let receipt = await waitForTransactionReceipt(ctx.web3, signedTx);
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
  createContext,
  getPrivateKey,
  getAccount,
  getCurrentGasPrices,
  setGas,
  signAndSend,
  waitForTransactionReceipt,
  setGasSignSendAndSaveTransaction
}
