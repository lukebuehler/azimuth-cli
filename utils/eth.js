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
  let providerUrl = argv.useMainnet ? argv.ethProviderMainnet : argv.ethProviderRopsten;
  let provider = new Web3.providers.HttpProvider(providerUrl);
  let web3 = new Web3(provider);
  web3.eth.handleRevert = true;
  return web3;
}

async function initContracts(argv, web3)
{
  const ropstenContract = ajs.chainDetails.ropsten.azimuth.address;
  const mainnetContract = ajs.chainDetails.mainnet.azimuth.address;
  var azAddress = argv.useMainnet ? mainnetContract : ropstenContract;
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
  if(argv.privateKey){
    pk = argv.privateKey;
  }
  else if(argv.wallet){
    let wallet = files.readJsonObject(argv.wallet);
    pk = wallet.ownership.keys.private;
  }
  else if(argv.ticket){
    const kg = require('urbit-key-generation');
    let wallet = await kg.generateWallet({
      ticket: argv.wallet,
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
  if(!ajs.utils.isValidPrivate(Buffer.from(pk, 'hex')))
  {
    console.error("Private key is not valid.");
    process.exit(1);
  }
  return pk;
}

//returns: https://web3js.readthedocs.io/en/v1.2.0/web3-eth-accounts.html#privatekeytoaccount
async function getAccount(web3, privateKey){
  return web3.eth.accounts.privateKeyToAccount(privateKey, false);
}

async function getCurrentGasPrices() {
  const axios = require('axios');
  let response = await axios.get('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
  return response.data.result;
}

function setGas(tx, argv)
{
  if(argv.gasLimit)
  {
    tx.gasLimit = argv.gasLimit;
  }
  if(argv.maxFee)
  {
    tx.maxFeePerGas = Web3.utils.toWei(argv.maxFee, 'gwei');
  }
  if(argv.maxPriorityFee)
  {
    tx.maxPriorityFeePerGas = Web3.utils.toWei(argv.maxPriorityFee, 'gwei');
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
  await txn.sendSignedTransaction(web3, txSigned);
  console.log('sent transaction: ' + txSigned.transactionHash);

  return txSigned;
}

async function waitForTransactionReciept(web3, txSigned)
{
    const transactionHash = txSigned.transactionHash;
    let reciept;
    while(!(reciept = await web3.eth.getTransactionReceipt(transactionHash)))
    {
        console.log(`no transaction reciept yet...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
    }
    return reciept;
}

function ensureTransactionReciept(reciept){
  if(!reciept || !reciept.status){

  }
}


module.exports = {
  createContext,
  getPrivateKey,
  getAccount,
  getCurrentGasPrices,
  setGas,
  signAndSend,
  waitForTransactionReciept
}
