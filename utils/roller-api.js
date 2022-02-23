const ob = require('urbit-ob')
const axios = require('axios')
const {JSONRPCClient } = require('json-rpc-2.0')

let requestCounter = 0;

function nextId(){
  requestCounter++;
  return requestCounter.toString(); //the roller rpc need a string ID, otherwise it does it does not work
}

function createClient(){
  var client = new JSONRPCClient(async function (jsonRPCRequest)
  {
    //TODO: add try catch, check for 200 response (see https://www.npmjs.com/package/json-rpc-2.0)

    //console.log(JSON.stringify(jsonRPCRequest));
    var response = await axios.post("http://localhost:8080/v1/roller", JSON.stringify(jsonRPCRequest));
    const jsonRPCResponse = response.data;
    //console.log(jsonRPCResponse)
    client.receive(jsonRPCResponse)
  }, nextId);
  return client;
}

// Roller JSON-RPC API documentation:
// https://documenter.getpostman.com/view/16338962/Tzm3nx7x

function getPoint(client, point){
  return client.request("getPoint", { ship: point })
}


module.exports = {
  createClient,
  getPoint
}

