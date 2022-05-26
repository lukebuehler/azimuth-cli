exports.command = 'modify-l2 <command>'
exports.desc = 'Make changes to a point via a roller (Layer 2).'
exports.builder = function (yargs) {
  
  yargs.demandOption('d');

  yargs.option('address',{
    alias: 'a',
    describe: 'The target address of the operation (spawn to, transfer to, etc.).',
    type: 'string',
  });

  yargs.option('private-key',{
    alias: 'k',
    describe: 'The private key that signs the transaction. Must be the key of the owner or proxy address.',
    type: 'string',
    conflicts: ['private-key-file', 'private-key-wallet-file', 'private-key-ticket']
  });
  yargs.option('private-key-file',{
    describe: 'A file that contains the private key that signs the transaction. Must be the key of the owner or proxy address.',
    type: 'string',
    conflicts: ['private-key', 'private-key-wallet-file', 'private-key-ticket']
  });
  yargs.option('private-key-wallet-file',{
    describe: 'A wallet JSON file that contains the private key that signs the transaction. Must be the key of the owner or proxy address.',
    type: 'string',
    conflicts: ['private-key', 'private-key-file', 'private-key-ticket']
  });
  yargs.option('private-key-ticket',{
    describe: 'A UP8 ticket to derrive the private key that signs the transaction. Must be the key of the owner or proxy address.',
    type: 'string',
    conflicts: ['private-key', 'private-key-file', 'private-key-wallet-file']
  });
 

  yargs.check(argv => {
    if (!argv.privateKey && !argv.privateKeyFile && !argv.privateKeyWalletFile && !argv.privateKeyTicket) 
      throw new Error('You must provide either --private-key, --private-key-file, --private-key-wallet-file, or --private-key-ticket that signs the transaction.')
    return true
  });

  yargs.option('points-file',{
    describe: `A file containing the points, with each point on a separate line, can be p or patp.`,
    type: 'string',
    conflicts: ['points', 'use-wallet-files']
  });
  yargs.option('points',{
    alias: ['p', 'point'],
    describe: `One or more points, can be p or patp.`,
    type: 'array',
    conflicts: ['points-file', 'use-wallet-files']
  });
  yargs.option('use-wallet-files',{
    describe: `Use the wallet JSON files in the current work directory as the points.`,
    type: 'boolean',
    conflicts: ['points-file', 'points']
  });
  yargs.check(argv => {
    if (!argv.pointsFile && !argv.points && !argv.useWalletFiles) throw new Error('You must provide either --points-file, --points, or --use-wallet-files.')
    if(!argv.useWalletFiles && !argv.address) throw new Error('You must provide either --address or --use-wallet-files, or both.')
    return true
  });

  return yargs.commandDir('modify-l2_cmds', {exclude:'common'} )
}
exports.handler = function (argv) {}