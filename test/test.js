var assert = require('assert');
const exec   = require('child_process').execFile

describe('version flag', async function() {
    it('should show the current version', function() {
      exec('node', ['./cli', '--version'], (error, stdout) => {
        if (error) { throw error }
        console.log(stdout);
      })
  });
});

describe('list cmd', async function() {
  describe('children cmd', async function() {
    it('should list all children of zod', function() {
      exec('node', ['./cli', 'list', 'children', '0'], (error, stdout) => {
        if (error) { throw error }
        console.log(stdout);
      })
    });
    
  });
});