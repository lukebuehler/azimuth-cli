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
async function getAccount(privateKey){
  return Accounts.privateKeyToAccount(privateKey, false);
}

async function getCurrentGasPrices() {
  //see: https://ethereum.stackexchange.com/questions/1113/can-i-set-the-gas-price-to-whatever-i-want
  let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
  let prices = {
    low: response.data.safeLow/10,
    medium: response.data.average/10,
    high: response.data.fast/10
  };
  return prices;
}

async function actualNetworkFee() {
  return new Promise(async (resolve) => {
    let gasPrices = await getCurrentGasPrices();
    let low = parseFloat(((21000 * gasPrices.low) / 1e9).toFixed(8));
    let medium = parseFloat(((21000 * gasPrices.medium) /  1e9).toFixed(8));
    let high = parseFloat(((21000 * gasPrices.high) /  1e9).toFixed(8));

    let fee = { low, medium, high };
    console.log('Ether fee',fee)
    resolve(fee)
  })
}

async function setGasAndSignAndSend(tx, pk){

  let pkBuffer = Buffer.from(pk, 'hex');
  if(!ajs.utils.isValidPrivate(pkBuffer))
      throw 'pk is not valid';

  tx.gasLimit = web3.utils.toHex(500000); //todo
  let gasValue = 30000;
  console.log('set gas to: ' + gasValue);
  tx.gas = web3.utils.toHex(gasValue); //todo
  //console.log(JSON.stringify(tx, null, 2));

  let gasPrices = await getCurrentGasPrices();
  let gasPrice = gasPrices.medium;
  gasPrice = gasPrice * 1.1; //pay 10% more than avg
  gasPrice = Math.min(gasPrice, 60); //make sure we dont pay more than the max
  let gasPriceValue = Math.floor(gasPrice * 1e9); //convert to gwei
  console.log(`set gas price to: ${gasPrice} (${gasPriceValue} gwei)`);
  tx.gasPrice = web3.utils.toHex(gasPriceValue);

  // Sign and Send Tx
  let txSigned = await txn.signTransaction(web3, tx, pkBuffer);
  console.log('signed transaction: ' + txSigned.transactionHash);
  //console.log(JSON.stringify(txSigned, null, 2));
  console.log('sending transaction...');
  await txn.sendSignedTransaction(web3, txSigned);
  console.log('sent transaction: ' + txSigned.transactionHash);

  return txSigned;
}

async function waitForTransactionReciept(txSigned)
{
    const transactionHash = txSigned.transactionHash;
    let reciept;
    while(!(reciept = await web3.eth.getTransactionReceipt(transactionHash)))
    {
        console.log(`no transaction reciept yet...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    return reciept;
}

module.exports = {
  createContext,
  getPrivateKey,
  getAccount,
  setGasAndSignAndSend,
  waitForTransactionReciept
}
