const ob = require('urbit-ob')
const ajsUtils = require('azimuth-js').utils;
const axios = require('axios')
const {JSONRPCClient } = require('json-rpc-2.0')
const validate = require('./validate')

const { hexToBytes } = require('web3-utils');
const { ecdsaSign } = require('secp256k1');

let requestCounter = 0;

function nextId(){
  requestCounter++;
  return requestCounter.toString(); //the roller rpc need a string ID, otherwise it does it does not work
}

function createClient(){
  var client = new JSONRPCClient(async function (jsonRPCRequest)
  {
    //TODO: add try catch, check for 200 response (see https://www.npmjs.com/package/json-rpc-2.0), show error codes

    console.log(JSON.stringify(jsonRPCRequest));
    var response = await axios.post("http://localhost:8080/v1/roller", JSON.stringify(jsonRPCRequest));
    const jsonRPCResponse = response.data;
    console.log(jsonRPCResponse)
    client.receive(jsonRPCResponse)
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
  console.log("RESULT: "+res);
  return res;
}

async function addSignature(client, method, params, privateKey){
  const hash = await getUnsignedTx(client, method, params);
  const sig = signTransactionHash(hash, privateKey);
  params["sig"] = sig;
  return params;
}

// Roller JSON-RPC API documentation:
// https://documenter.getpostman.com/view/16338962/Tzm3nx7x

function getPoint(client, point){
  return client.request("getPoint", { ship: point });
}

async function spawn(client, parentPoint, spawnPoint, newOwnerAddress, signingAddress, privateKey){
  const parentPatp = ob.patp(validate.point(parentPoint, true));
  const spawnPatp = ob.patp(validate.point(spawnPoint, true));
  const newOwnerAddressValid = validate.address(newOwnerAddress, true);
  const signingAddressValid = validate.address(signingAddress, true);

  let params = {
    address: signingAddressValid,
    from: {
      ship: parentPatp,
      proxy: "own"
    },
    data: {
      ship: spawnPatp,
      address: newOwnerAddressValid,
    }
  };
  const method = "spawn";
  params = await addSignature(client, method, params, privateKey);
  return await client.request(method, params);
}


module.exports = {
  createClient,
  getPoint,
  spawn
}

