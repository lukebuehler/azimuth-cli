const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const _ = require('lodash')
const {files, validate, eth} = require('../../utils')

exports.command = 'spawn'
exports.desc = 'Spawn one or more points, where the points are patp or p. Can also provide the points to spawn via files. See options.'
exports.builder = (yargs) =>{
  yargs.demandOption('d');
  yargs.demandOption('a');

  yargs.option('file',{
    describe: 'A file containing the points to spawn with each point on a separate line, can be p or patp.',
    type: 'string',
    conflicts: 'points'
  });
  yargs.option('points',{
    alias: ['p', 'point'],
    describe: 'One or more points to spawn, can be p or patp.',
    type: 'array',
    conflicts: 'file'
  });
  yargs.check(argv => {
    if (!argv.file && !argv.points) throw new Error('You must provide either --file or --points')
    return true
  });
}

exports.handler = async function (argv) 
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const targetAddress = validate.address(argv.address, true);
  const privateKey = eth.getPrivateKey(argv);
  const ethAccount = eth.getAccount(privateKey);

  //parse the points
  const pointsRaw = argv.points ?? wd.readLines(workDir, argv.file);
  let points = _(pointsRaw)
    .map(point => validate.point(point, false))
    .reject(_.isNull)
    .value();

  if(!points || points.length == 0){
    console.error('No points provided.');
    process.exit(1);
  }

  //for each point, generate a master ticket and wallet file if the file doesnt already exists
  console.log(`Will spawn ${points.length} points`);
  for (const p of points) {
    tryToSpawnPoint(p, targetAddress, ethAccount)
  }
}

async function tryToSpawnPoint(point, targetAddress, account)
{
    var res = await ajs.check.canSpawn(contracts, point, account.address);
    if(!res.result){
        console.log(`cannot spawn point ${point}: ${res.reason}`);
        return null;
    }

    // Create and Send Tx
    let tx = ecliptic.spawn(contracts, point, targetAddress);
    let signedTx = await eth.setGasAndSignAndSend(tx, pk);

    // Wait to be owner of p
    while((await azimuth.isOwner(contracts, point, ownerAndTargetAddress)) == false)
    {
        console.log(`not yet owner of ${point}, will wait...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log(`now owner of ${point}.`);

    return await eth.waitForTransactionReciept(signedTx);

}





