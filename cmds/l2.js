exports.command = 'l2 <command>'
exports.desc = 'Azimuth Layer 2 Commands'
exports.builder = function (yargs) {
  yargs.option('private-key',{
    alias: 'k',
    describe: 'The private key that signs the transaction. Must be the key of the owner or proxy address.',
    type: 'string',
  });
  return yargs.commandDir('l2_cmds')
}
exports.handler = function (argv) {}