const ob = require('urbit-ob')
const kg = require('urbit-key-generation');
const ticket = require('up8-ticket');
const _ = require('lodash')
const {files, validate, eth, findPoints} = require('../../utils')
const ajs = require('azimuth-js')

exports.command = 'report'
exports.desc = 'Generates a CSV report for the provided points using the data in the current work directory.'
exports.builder = (yargs) =>{
  yargs.demandOption('d');

  yargs.option('report-file',{
    describe: 'The file name of the report.',
    type: 'string',
    default: 'report.csv'
  });

  yargs.option('points-file',{
    describe: 'A file containing the points with each point on a separate line, can be p or patp.',
    type: 'string',
    conflicts: ['points', 'use-wallet-files']
  });
  yargs.option('points',{
    alias: ['p', 'point'],
    describe: 'One or more points to generate a wallet for, can be p or patp.',
    type: 'array',
    conflicts: ['points-file', 'use-wallet-files']
  });
  yargs.option('use-wallet-files',{
    describe: `Use the wallet JSON files in the current work directory for the points and the network keys.`,
    type: 'boolean',
    conflicts: ['points-file', 'points']
  });
  yargs.check(argv => {
    if (!argv.pointsFile && !argv.points && !argv.useWalletFiles) throw new Error('You must provide either --points-file, --points, or --use-wallet-files')
    return true
  });
}

exports.handler = async function (argv) 
{
  const workDir = files.ensureWorkDir(argv.workDir);
  const ctx = await eth.createContext(argv);

  const wallets = argv.useWalletFiles ? findPoints.getWallets(workDir) : null;
  const points = findPoints.getPoints(argv, workDir, wallets);

  const csvHeader = 
    'patp,p,ship_type,master_ticket,network_keyfile,' +
    'owner_address,proxy_address,' + //management_address is omitted because there is currently no API to retrieve the management proxy address
    'spawn_transaction,management_proxy_transaction,spawn_proxy_transaction,network_key_transaction,transfer_transaction';
  let csvLines = [csvHeader];

  console.log(`Will process ${points.length} points for the report.`);
  for (const p of points) {
    const patp = ob.patp(p);
    const shipType = ob.clan(patp);
    let csvLine = `${patp},${p},${shipType},`;

    //see if we have a wallet to get the master from
    let masterTicket = '';
    let wallet =  argv.useWalletFiles ? wallets[patp] : null;
    if(wallet){
      masterTicket = wallet.ticket;
    }
    //see if there is a network keyfile
    let networkKeyfileContents = '';
    const networkKeyfileName = `${patp.substring(1)}-${DEFAULT_REVISION}.key`;
    if(files.fileExists(workDir, networkKeyfileName))
    {
      networkKeyfileContents = files.readLines(workDir, networkKeyfileName)[0];
    }
    csvLine += `${masterTicket},${networkKeyfileContents},`;

    //get the addresses
    const ownerAddress = await ajs.azimuth.getOwner(ctx.contracts, p);
    const spawnProxyAddress = await ajs.azimuth.getSpawnProxy(ctx.contracts, p);
    csvLine += `${ownerAddress},${spawnProxyAddress},`;
   
    //try to get the transaction reciepts
    let spawnTransaction = tryGetTransactionHash(patp, workDir, 'spawn');
    let managementProxyTransaction = tryGetTransactionHash(patp, workDir, 'managementproxy');
    let spawnProxyTransaction = tryGetTransactionHash(patp, workDir, 'spawnproxy');
    let networkkeyTransaction = tryGetTransactionHash(patp, workDir, 'networkkey');
    let transferTransaction = tryGetTransactionHash(patp, workDir, 'transfer');
    csvLine += `${spawnTransaction},${managementProxyTransaction},${spawnProxyTransaction},${networkkeyTransaction},${transferTransaction}`;

    csvLines.push(csvLine);
  }

  let csvFileName = files.writeFile(workDir, argv.reportFile, csvLines);
  console.log('Wrote CSV file to: '+csvFileName);

}

function tryGetTransactionHash(patp, workDir, operationPostfix){
  const transactionFile = `${patp.substring(1)}-reciept-${operationPostfix}.json`;
    if(files.fileExists(workDir, transactionFile)){
      return files.readJsonObject(workDir, transactionFile).transactionHash;
    }
    return '';
}

const DEFAULT_REVISION = 1;
