const os = require('os');
const files = require('../utils/files');
const fs = require("fs");
const path = require("path");
const {execFile} = require('child_process');

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

const baseArgs = ['--use-mainnet=false', `--work-dir=${testWorkDir}`];

//===================
// Tests
//===================

// https://www.chaijs.com/api/bdd/#method_least


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
      expect(children).to.have.lengthOf.at.least(1);
      expect(children).to.have.lengthOf.at.most(255);
    });
  });

  describe('children 0 --unspawned', async function() {
    it('should list all unspawned children of zod', async function() {
      let children = await execCliAndGetLines('list', 'children', '0', '--unspawned', ...baseArgs);
      children.shift();//starts with a header string
      expect(children).to.have.lengthOf.at.least(1);
      expect(children).to.have.lengthOf.at.most(255);
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

  describe('wallet --points=zod', async function() {
    this.timeout(10000); //generating wallets takes a bit of time 
    it('should create a wallet file for the point', async function() {
      await execCliAndGetLines('generate', 'wallet', '--points=zod', ...baseArgs);
      assert.isTrue(files.fileExists(testWorkDir, 'zod-wallet.json'));
    });
  });

});