const ob = require('urbit-ob')
const ajsUtils = require('azimuth-js').utils;
const axios = require('axios')
const {JSONRPCClient } = require('json-rpc-2.0')
const validate = require('./validate')

const { hexToBytes } = require('web3-utils');
const { ecdsaSign } = require('secp256k1');

const CRYPTO_SUITE_VERSION = 1;
let requestCounter = 0;

async function selectDataSource(argv){
  if(argv.useRoller){
    try{
      await getRollerConfig(createClient(argv)); //will throw a connection refused error if not available
      return 'roller';
    }
    catch(error){
      throw 'Roller not available. You required the usage of the roller, please ensure it is running and can be reached.'
    }
  }
  else if(argv.useAzimuth){
    return 'azimuth';
  }
  else{
    //check if the roller client is available;
    // if yes, use the roller, otherwise use azimuth
    try{
      await getRollerConfig(createClient(argv)); //will throw a connection refused error if not available
      return 'roller';
    }
    catch(error){
      console.log('Roller not available, falling back to using azimuth, information might not be correct.');
      return 'azimuth';
    }
  }
  throw 'could not determine data source';
}

function nextId(){
  requestCounter++;
  return requestCounter.toString(); //the roller rpc need a string ID, otherwise it does it does not work
}

function createClient(argv){
  let rollerUrl = 
    argv.rollerProvider == 'local' 
    ? argv.rollerLocal 
    : argv.rollerProvider == 'urbit' 
    ? argv.rollerUrbit 
    : null;
  //console.log(rollerUrl);
  if(rollerUrl == null){
    rollerUrl = "http://localhost:8080/v1/roller";
  }
  var client = new JSONRPCClient(async function (jsonRPCRequest)
  {
    try {
      //console.log(JSON.stringify(jsonRPCRequest));
      var response = await axios.post(rollerUrl, JSON.stringify(jsonRPCRequest));
      if (response.status === 200) {
        const jsonRPCResponse = response.data;
        client.receive(jsonRPCResponse);
      } else {
        console.error(`Received non-200 response: ${response.status}`);
      }
    } catch(error) {
      console.error('Error sending request:', error.message);
    }
  }, nextId);
  return client;
}

function signTransactionHash(msg, pk) {
  const pkBuffer = Buffer.from(pk, 'hex');
  if(!ajsUtils.isValidPrivate(pkBuffer))
      throw 'pk is not valid';

  //  msg is a keccak-256 hash
  //
  const hashed = Buffer.from(hexToBytes(msg));
  const { signature, recid } = ecdsaSign(hashed, pkBuffer);
  // add key recovery parameter
  const ethSignature = new Uint8Array(65);
  ethSignature.set(signature);
  ethSignature[64] = recid;
  return `0x${Buffer.from(ethSignature).toString('hex')}`;
}

function getNonce(client, params){
  const ship = params.from.ship;
  const nonceParams = {
    from: params.from
  };
  return client.request("getNonce", nonceParams);
}

//use this if signing via metamask or wallet connect
async function prepareForSigning(client, method, params){
  const nonce = await getNonce(client, params);
  const hashParams = {
    tx: method,
    nonce: nonce,
    from: params.from,
    data: params.data
  }
  return await client.request("prepareForSigning", hashParams);
}

//use this if singing directly with pk
async function getUnsignedTx(client, method, params){
  const nonce = await getNonce(client, params);
  const hashParams = {
    tx: method,
    nonce: nonce,
    from: params.from,
    data: params.data
  }
  var res = await client.request("getUnsignedTx", hashParams);
  //console.log("RESULT: "+res);
  return res;
}

async function addSignature(client, method, params, privateKey){
  const hash = await getUnsignedTx(client, method, params);
  const sig = signTransactionHash(hash, privateKey);
  params["sig"] = sig;
  return params;
}

function createTransactionReceipt(method, params, txHash){
  return {
    sig: params.sig,
    hash: txHash,
    type: method
  }
}

//============================================
// API
//============================================
// Roller JSON-RPC API documentation:
// https://documenter.getpostman.com/view/16338962/Tzm3nx7x

function getRollerConfig(client){
  return client.request("getRollerConfig", { });
}

function getAllPending(client){
  return client.request("getAllPending", { });
}

function getPendingByAddress(client, address){
  return client.request("getPendingByAddress", { address: address });
}

function whenNextBatch(client){
  return client.request("whenNextBatch", { });
}


function getPoint(client, point){
  const patp = ob.patp(validate.point(point, true));
  return client.request("getPoint", { ship: patp });
}

function getShips(client, address){
  return client.request("getShips", { address: address });
}

function getSpawned(client, point){
  const patp = ob.patp(validate.point(point, true));
  return client.request("getSpawned", { ship: patp });
}

function getUnspawned(client, point){
  const patp = ob.patp(validate.point(point, true));
  return client.request("getUnspawned", { ship: patp });
}

async function spawn(client, parentPoint, spawnPoint, newOwnerAddress, signingAddress, privateKey){
  const parentPatp = ob.patp(validate.point(parentPoint, true));
  const spawnPatp = ob.patp(validate.point(spawnPoint, true));
  const newOwnerAddressValid = validate.address(newOwnerAddress, true);
  const signingAddressValid = validate.address(signingAddress, true);
  const proxy = await getSpawnProxyType(client, parentPatp, signingAddress);
  //console.log("Proxy: "+proxy);

  let params = {
    address: signingAddressValid,
    from: {
      ship: parentPatp,
      proxy: proxy
    },
    data: {
      ship: spawnPatp,
      address: newOwnerAddressValid,
    }
  };
  const method = "spawn";
  params = await addSignature(client, method, params, privateKey);
  var tx = await client.request(method, params);
  return createTransactionReceipt(method, params, tx);
}

async function transferPoint(client, point, reset, newOwnerAddress, signingAddress, privateKey){
  const patp = ob.patp(validate.point(point, true));
  const newOwnerAddressValid = validate.address(newOwnerAddress, true);
  const signingAddressValid = validate.address(signingAddress, true);
  const proxy = await getTransferProxyType(client, patp, signingAddress);

  let params = {
    address: signingAddressValid,
    from: {
      ship: patp,
      proxy: proxy
    },
    data: {
      reset: reset,
      address: newOwnerAddressValid,
    }
  };
  const method = "transferPoint";
  params = await addSignature(client, method, params, privateKey);
  var tx = await client.request(method, params);
  return createTransactionReceipt(method, params, tx);
}

async function setManagementProxy(client, point, managementProxyAddress, signingAddress, privateKey){
  const patp = ob.patp(validate.point(point, true));
  const targetAddress = validate.address(managementProxyAddress, true);
  const signingAddressValid = validate.address(signingAddress, true);
  const proxy = "own"; //only the owner can set the management proxy

  let params = {
    address: signingAddressValid,
    from: {
      ship: patp,
      proxy: proxy
    },
    data: {
      address: targetAddress,
    }
  };
  const method = "setManagementProxy";
  params = await addSignature(client, method, params, privateKey);
  var tx = await client.request(method, params);
  return createTransactionReceipt(method, params, tx);
}

async function setSpawnProxy(client, point, spawnProxyAddress, signingAddress, privateKey){
  const patp = ob.patp(validate.point(point, true));
  const targetAddress = validate.address(spawnProxyAddress, true);
  const signingAddressValid = validate.address(signingAddress, true);
  const proxy = "own"; //only the owner can set the spawn proxy

  let params = {
    address: signingAddressValid,
    from: {
      ship: patp,
      proxy: proxy
    },
    data: {
      address: targetAddress,
    }
  };
  const method = "setSpawnProxy";
  params = await addSignature(client, method, params, privateKey);
  var tx = await client.request(method, params);
  return createTransactionReceipt(method, params, tx);
}

async function setTransferProxy(client, point, transferProxyAddress, signingAddress, privateKey){
  const patp = ob.patp(validate.point(point, true));
  const targetAddress = validate.address(transferProxyAddress, true);
  const signingAddressValid = validate.address(signingAddress, true);
  const proxy = "own"; //only the owner can set the transfer proxy

  let params = {
    address: signingAddressValid,
    from: {
      ship: patp,
      proxy: proxy
    },
    data: {
      address: targetAddress,
    }
  };
  const method = "setTransferProxy";
  params = await addSignature(client, method, params, privateKey);
  var tx = await client.request(method, params);
  return createTransactionReceipt(method, params, tx);
}

async function configureKeys(client, point, encryptPublic, authPublic, breach, signingAddress, privateKey){
  const patp = ob.patp(validate.point(point, true));
  const signingAddressValid = validate.address(signingAddress, true);
  const proxy = await getManagementProxyType(client, patp, signingAddress); //either the owner or the manage proxy can set the keys

  let params = {
    address: signingAddressValid,
    from: {
      ship: patp,
      proxy: proxy
    },
    data: {
      encrypt: encryptPublic,
      auth: authPublic,
      cryptoSuite: CRYPTO_SUITE_VERSION.toString(),
      breach: breach
    }
  };
  const method = "configureKeys";
  params = await addSignature(client, method, params, privateKey);
  var tx = await client.request(method, params);
  return createTransactionReceipt(method, params, tx);
}

async function getManagementProxyType(client, point, signingAddress){
  const pointInfo = await getPoint(client, point);
  if(ajsUtils.addressEquals(pointInfo.ownership.owner.address, signingAddress))
    return 'own';
  else if(ajsUtils.addressEquals(pointInfo.ownership.managementProxy.address, signingAddress))
    return 'manage';
  return undefined;
}

async function getSpawnProxyType(client, point, signingAddress){
  const pointInfo = await getPoint(client, point);
  if(ajsUtils.addressEquals(pointInfo.ownership.owner.address, signingAddress))
    return 'own';
  else if(ajsUtils.addressEquals(pointInfo.ownership.spawnProxy.address, signingAddress))
    return 'spawn';
  return undefined;
}

async function getTransferProxyType(client, point, signingAddress){
  const pointInfo = await getPoint(client, point);
  if(ajsUtils.addressEquals(pointInfo.ownership.owner.address, signingAddress))
    return 'own';
  else if(ajsUtils.addressEquals(pointInfo.ownership.transferProxy.address, signingAddress))
    return 'transfer';
  return undefined;
}

async function isOwner(client, point, address) {
  const pointInfo = await getPoint(client, point);
  return ajsUtils.addressEquals(pointInfo.ownership.owner.address, address);
}

async function isManagementProxy(client, point, address) {
  const pointInfo = await getPoint(client, point);
  return ajsUtils.addressEquals(pointInfo.ownership.managementProxy.address, address);
}

async function isSpawnProxy(client, point, address) {
  const pointInfo = await getPoint(client, point);
  return ajsUtils.addressEquals(pointInfo.ownership.spawnProxy.address, address);
}

async function isTransferProxy(client, point, address) {
  const pointInfo = await getPoint(client, point);
  return ajsUtils.addressEquals(pointInfo.ownership.transferProxy.address, address);
}

async function canConfigureKeys(client, point, address) {
  return await isOwner(client, point, address) || await isManagementProxy(client, point, address);
}

async function canTransfer(client, point, address) {
  return await isOwner(client, point, address) || await isTransferProxy(client, point, address);
}

async function canSpawn(client, point, address) {
  return await isOwner(client, point, address) || await isSpawnProxy(client, point, address);
}

module.exports = {
  selectDataSource,
  createClient,
  getRollerConfig,
  getAllPending,
  getPendingByAddress,
  whenNextBatch,

  getPoint,
  getShips,
  getSpawned,
  getUnspawned,

  spawn,
  transferPoint,
  setManagementProxy,
  setTransferProxy,
  setSpawnProxy,
  configureKeys,

  getManagementProxyType,
  getSpawnProxyType,
  getTransferProxyType,

  isOwner,
  isManagementProxy,
  isSpawnProxy,
  isTransferProxy,
  canConfigureKeys,
  canTransfer,
  canSpawn
}

