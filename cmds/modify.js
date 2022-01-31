exports.command = 'modify <command>'
exports.desc = 'Make changes to the on-chain state on Azimuth.'
exports.builder = function (yargs) {
  
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

  yargs.option('max-fee',{
    describe: 'The maximum eth gas fee in gwei (e.g. 100) you are willing to pay. Corresponds to web3 maxFeePerGas.',
    type: 'number',
  });
  yargs.option('max-priority-fee',{
    describe: 'The max tip to pay to the miner in gwei (e.g. 5). Corresponds to web3 maxPriorityFeePerGas.',
    type: 'number',
  });
  yargs.option('gas-limit',{
    describe: 'The max gas the transaction can cost in gwei (e.g. 100000). Corresponds to web3 gasLimit.',
    default: 500000,
    type: 'number',
  });
  yargs.option('gas',{
    describe: 'The gas for the transaction (e.g. 30000). Corresponds to web3 gas.',
    default: 30000,
    type: 'number',
  });

  yargs.demandOption('d');

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

  return yargs.commandDir('modify_cmds', {exclude:'common'} )
}
exports.handler = function (argv) {}