const ob = require('urbit-ob')
const kg = require('urbit-key-generation');
const ticket = require('up8-ticket');
const _ = require('lodash')
const {files, validate} = require('../../utils')

// needs to be required explicitly for up8-ticket to work
global.crypto = require('crypto')

exports.command = 'wallet'
exports.desc = 'Generates Urbit HD wallets as JSON files for a set of points.'
exports.builder = (yargs) =>{
  yargs.demandOption('d');

  yargs.option('points-file',{
    describe: 'A file containing the points with each point on a separate line, can be p or patp.',
    type: 'string',
    conflicts: 'points'
  });
  yargs.option('points',{
    alias: ['p', 'point'],
    describe: 'One or more points to generate a wallet for, can be p or patp.',
    type: 'array',
    conflicts: 'points-file'
  });
  yargs.check(argv => {
    if (!argv.pointsFile && !argv.points) throw new Error('You must provide either --points-file or --points')
    return true
  });
  yargs.option('bit-size',{
    choices: [64, 128, 384],
    describe: 'The bit size for all wallets. If not set, will use the standard bit size for each individual point.',
    type: 'number',
  });
  yargs.option('generate-network-keys',{
    describe: 'Generate the network keys in the wallet (does not set them on chain).',
    default: true,
    type: 'boolean',
  });
}

exports.handler = async function (argv) 
{
  const workDir = files.ensureWorkDir(argv.workDir);
  //parse the points
  const pointsRaw = argv.points ?? files.readLines(workDir, argv.pointsFile);
  let points = _(pointsRaw)
    .map(point => validate.point(point, false))
    .reject(_.isNull)
    .value();

  if(!points || points.length == 0){
    console.error('No points provided.');
    process.exit(1);
  }

  //for each point, generate a master ticket and wallet file if the file doesnt already exists
  console.log(`Will generate HD wallets for ${points.length} points`);
  for (const p of points) {
    const patp = ob.patp(p);
    const walletFileName = patp.substring(1)+'-wallet.json';
    if(!files.fileExists(workDir, walletFileName))
    {
      console.log(`Generating master ticket for ${patp}...`);
      //There are three default bite sizes for UP8 tickets, 64, 128, and 384, usually corresponding to planets, stars, and galaxies, but this is not required.
      // If the bite size is provided by the user, we use that one, otherwise we use the size corresponding to the point
      const bitSize = argv.bitSize ?? getBitSize(p);
      const masterTicket = await ticket.gen_ticket_more(bitSize);
      //The wallet is used only for a single point, it contains the master ticket and the name of the point.
      // Optionally, the wallet can also contain the private and public keys that are needed to set the keys in azimuth and generate the Arvo keyfile (boot property). 
      // By default, we generate those keys because they are useful when using the master ticket later for on-chain operations. 
      const wallet = await kg.generateWallet({
        ticket: masterTicket,
        ship: p,
        boot: argv.generateNetworkKeys,
        revision: DEFAULT_REVISION
      });
      const file = files.writeFile(workDir, walletFileName, wallet);
      console.log(`Wrote wallet file to: ${file}`);
    }
    else{
      console.log(`Wallet file ${walletFileName} already exists, will skip generating wallet for ${patp}.`);
    }
  }
  
  process.exit(0);
}


const DEFAULT_REVISION = 1;

const MIN_STAR = 256;
const MIN_PLANET = 65536;
const PLANET_ENTROPY_BITS = 64;
const STAR_ENTROPY_BITS = 128;
const GALAXY_ENTROPY_BITS = 384;

const getBitSize = point =>
  point < MIN_STAR
    ? GALAXY_ENTROPY_BITS
    : point < MIN_PLANET
    ? STAR_ENTROPY_BITS
    : PLANET_ENTROPY_BITS;



