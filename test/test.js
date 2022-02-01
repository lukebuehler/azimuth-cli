const os = require('os');
const files = require('../utils/files');
const fs = require("fs");
const path = require("path");
const {execFile} = require('child_process');

const bip39  = require('bip39');
const hdkey  = require('hdkey');
const Web3   = require('web3');
const ethUtil  = require('ethereumjs-util');

const ajs = require('azimuth-js');
const check = ajs.check;
const ecliptic = ajs.ecliptic;
const azimuth = ajs.azimuth;
const delsend = ajs.delegatedSending;
const details = ajs.chainDetails;
const txn = ajs.txn;
const claims = ajs.claims;

var chai = require('chai');  
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should(); 

//===================
// Helper functions
//===================

//convert standard execFile, which uses a callback function, to a promise
function exec(cmd, args) {
  return new Promise(function (resolve, reject) {
    execFile(cmd, args, (error, stdout, stderr) => {
      if (error) { reject(error); }
      else{ resolve(stdout); }
    });
  });
}

async function execCli(...args) {
  args.unshift('./cli');
  return await exec('node', args);
}

async function execCliAndGetLines(...args) {
  args.unshift('./cli');
  var output = await exec('node', args);
  var lines = output.split(os.EOL);
  lines = lines.filter(l=>l); //remove empty lines
  return lines;
}

async function firstUnownedGalaxy(contracts) {
  let galaxy = 0;
  while (await check.hasOwner(contracts, galaxy)) galaxy++;
  return galaxy;
}

async function sendTransaction(web3, tx, privateKey) {
  if (!ethUtil.isValidPrivate(privateKey)) {
    throw "Invalid key";
  }

  let addr = ethUtil.privateToAddress(privateKey);

  tx.from = renderAsHex(addr);

  let stx = await txn.signTransaction(web3, tx, privateKey);
  return txn.sendSignedTransaction(web3, stx);
}

function renderAsHex(value) {
  return ethUtil.addHexPrefix(value.toString('hex'));
}

//===================
// Setup
//===================
const baseDir = path.resolve(os.homedir(), 'dev/azimuth-cli-tests');

const dateString = (new Date()).toISOString().replace(/[^0-9]/g, "").slice(0, 14); //we want YYYYMMDDHHmmSS
const testWorkDir = path.resolve(baseDir, dateString);
if(fs.existsSync(testWorkDir)){
  fs.rmdirSync(testWorkDir, { recursive: true })
}
fs.mkdirSync(testWorkDir, { recursive: true });

console.log('Test work directory is: '+testWorkDir);

const baseArgs = ['--eth-provider=ganache', `--work-dir=${testWorkDir}`];

// accounts
const mnemonic = 'benefit crew supreme gesture quantum web media hazard theory mercy wing kitten';

const seed = bip39.mnemonicToSeedSync(mnemonic);

const hd = hdkey.fromMasterSeed(seed);

const hdPath = "m/44'/60'/0'/0";

const pair0 = ajs.getKeyPair(hd, hdPath, 0);
const pair1 = ajs.getKeyPair(hd, hdPath, 1);
const pair2 = ajs.getKeyPair(hd, hdPath, 2);

const ac0 = ethUtil.addHexPrefix(pair0.address.toString('hex'));
const ac1 = ethUtil.addHexPrefix(pair1.address.toString('hex'));
const ac2 = ethUtil.addHexPrefix(pair2.address.toString('hex'));

console.log('ac0: '+ac0);
console.log('ac1: '+ac1);
console.log('ac2: '+ac2);

const pk0 = pair0.privateKey;
const pk0String = ethUtil.addHexPrefix(pk0.toString('hex'));
const pk1 = pair1.privateKey;
const pk2 = pair2.privateKey;

const zaddr = ethUtil.zeroAddress();

// contract addresses
const contractAddresses = {
  ecliptic: '0x56db68f29203ff44a803faa2404a44ecbb7a7480',
  azimuth:  '0x863d9c2e5c4c133596cfac29d55255f0d0f86381',
  polls:    '0x935452c45eda2958976a429c9733c40302995efd',
  claims:   '0xe0834579269eac6beca2882a6a21f6fb0b1d7196',
  delegatedSending: '0xb71c0b6cee1bcae56dfe95cd9d3e41ddd7eafc43'
}

let provider  = new Web3.providers.HttpProvider('http://localhost:8545');
let web3      = new Web3(provider);
let contracts = ajs.initContracts(web3, contractAddresses);

const someBytes32 = web3.utils.asciiToHex('whatever');

let galaxy       = 0;
let galaxyPlanet = 65536;
let star1        = 256;
let star2        = 512;
let star3        = 768;
let planet1a     = 65792;
let planet1b     = 131328;
let planet1c     = 196864;
let planet1d     = 262400;

const modifyBaseArgsFromAc0ToAc0 = [`--private-key=${pk0String}`, `--address=${ac0}`]
const modifyBaseArgsFromAc0ToAc1 = [`--private-key=${pk0String}`, `--address=${ac1}`]
const modifyBaseArgsFromAc0ToAc2 = [`--private-key=${pk0String}`, `--address=${ac2}`]

//===================
// Tests
//===================

// https://www.chaijs.com/api/bdd/#method_least



it('prepare the environment', async function() {
  this.timeout(20000)

  let tx = ecliptic.createGalaxy(contracts, 0, ac0);
  await sendTransaction(web3, tx, pk0);

  tx = ecliptic.createGalaxy(contracts, 1, ac0);
  await sendTransaction(web3, tx, pk0);

  //set keys so the galaxy is allowed to spawn
  // tx = ecliptic.configureKeys(contracts, galaxy, someBytes32, someBytes32, 1, false);
  // await sendTransaction(web3, tx, pk0);

  // galaxy   = await firstUnownedGalaxy(contracts);
  // star1    = star1 + galaxy;
  // star2    = star2 + galaxy;
  // planet1a = planet1a + galaxy;
  // planet1b = planet1b + galaxy;
  // planet1c = planet1c + galaxy;
  // planet1d = planet1d + galaxy;
});

describe('#list', async function() {

  describe('children 0', async function() {
    it('should list all children of zod', async function() {
      let children = await execCliAndGetLines('list', 'children', '0', ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf(255);
    });
  });

  describe('children 0 --spawned', async function() {
    it('should list all spawned children of zod', async function() {
      let children = await execCliAndGetLines('list', 'children', '0', '--spawned', ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf(0);
    });
  });

  describe('children 0 --unspawned', async function() {
    it('should list all unspawned children of zod', async function() {
      let children = await execCliAndGetLines('list', 'children', '0', '--unspawned', ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf(255);
      expect(children).to.have.lengthOf.at.most(255);
    });
  });

  describe('owner zodAddr', async function() {
    it('should list owner of two galaxies', async function() {
      let children = await execCliAndGetLines('list', 'owner', ac0, ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf(2);
    });
  });

});


describe('#generate', async function() {

  describe('spawn-list zod', async function() {
    it('should create a file, containing child points that can be spawned', async function() {
      await execCliAndGetLines('generate', 'spawn-list', 'zod', '--force', ...baseArgs);
      assert.isTrue(files.fileExists(testWorkDir, 'spawn-list.txt'));
    });
  });

  describe('spawn-list zod --count=10', async function() {
    it('should create a file, containing 10 child points that can be spawned', async function() {
      await execCliAndGetLines('generate', 'spawn-list', 'zod', '--count=10', '--force', ...baseArgs);
      assert.isTrue(files.fileExists(testWorkDir, 'spawn-list.txt'));
      const spwanList = files.readLines(testWorkDir, 'spawn-list.txt');
      expect(spwanList).to.have.lengthOf(10);
    });
  });

  describe('network-key --points=zod', async function() {
    this.timeout(10000); //generating wallets takes a bit of time 
    it('should create network keys and network keyfile', async function() {
      await execCliAndGetLines('generate', 'network-key', '--points=zod', ...baseArgs);
      assert.isTrue(files.fileExists(testWorkDir, 'zod-networkkeys-1.json'));
      assert.isTrue(files.fileExists(testWorkDir, 'zod-1.key'));
    });
  });

  describe('wallet --points=marzod', async function() {
    this.timeout(10000); //generating wallets takes a bit of time 
    it('should create a wallet file for the point', async function() {
      await execCliAndGetLines('generate', 'wallet', '--points=marzod', ...baseArgs);
      assert.isTrue(files.fileExists(testWorkDir, 'marzod-wallet.json'));
    });
  });
});


describe('#modify', async function() {
  this.timeout(10000); 

  describe('network-key --points=zod', async function() {
    it('should set the network keys for zod', async function() {
      //this also allows us to use zod to spawn further points, only booted points can spawn
      let lines = await execCliAndGetLines('modify', 'network-key', `--points=${galaxy}`, ...baseArgs, ...modifyBaseArgsFromAc0ToAc0);
      assert.isTrue(files.fileExists(testWorkDir, 'zod-reciept-networkkey.json'));
    });
  });

  describe('spawn --points=marzod', async function() {
    it('should spawn the first star under zod', async function() {
      let lines = await execCliAndGetLines('modify', 'spawn', `--points=${star1}`, ...baseArgs, ...modifyBaseArgsFromAc0ToAc0);
      assert.isTrue(files.fileExists(testWorkDir, 'marzod-reciept-spawn.json'));

      let children = await execCliAndGetLines('list', 'children', 'zod', '--spawned', ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf.at.least(1);
    });
  });

  describe('management-proxy --points=marzod', async function() {
    it('should set the management proxy of marzod', async function() {
      let lines = await execCliAndGetLines('modify', 'management-proxy', `--points=${star1}`, ...baseArgs, ...modifyBaseArgsFromAc0ToAc1);
      assert.isTrue(files.fileExists(testWorkDir, 'marzod-reciept-managementproxy.json'));
    });
  });

  describe('spawn-proxy --points=marzod', async function() {
    it('should set the spawn proxy of marzod', async function() {
      let lines = await execCliAndGetLines('modify', 'spawn-proxy', `--points=${star1}`, ...baseArgs, ...modifyBaseArgsFromAc0ToAc1);
      assert.isTrue(files.fileExists(testWorkDir, 'marzod-reciept-spawnproxy.json'));
    });
  });

  describe('transfer --points=marzod', async function() {
    it('should transfer marzod to acc2', async function() {
      let lines = await execCliAndGetLines('modify', 'transfer', `--points=${star1}`, ...baseArgs, ...modifyBaseArgsFromAc0ToAc2);
      assert.isTrue(files.fileExists(testWorkDir, 'marzod-reciept-transfer.json'));

      //ac2 should have one child now
      let children = await execCliAndGetLines('list', 'owner', ac2, ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf(1);
    });
  });

});

describe('#generate report', async function() {

  describe('report --points=zod --points=marzod', async function() {
    it('should generate a report for zod and marzod', async function() {
      //this also allows us to use zod to spawn further points, only booted points can spawn
      let lines = await execCliAndGetLines('generate', 'report', `--points=${galaxy}`, `--points=${star1}`, ...baseArgs);
      assert.isTrue(files.fileExists(testWorkDir, 'report.csv'));
      const csvLines = files.readLines(testWorkDir, 'report.csv');
      expect(csvLines).to.have.lengthOf(3);
    });
  });

});
