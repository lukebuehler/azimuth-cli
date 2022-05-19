const ob = require('urbit-ob')
const kg = require('urbit-key-generation');
const ticket = require('up8-ticket');
const _ = require('lodash')
const {files, validate, eth, findPoints, rollerApi} = require('../../utils')
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

    //todo: remove this and figure out the dominion pased on the parent point
  yargs.option('use-roller',{
    alias: 'l2',
    describe: 'Connect to a roller to get the unspawned points instead of azimuth.',
    type: 'boolean',
  });
}

exports.handler = async function (argv) 
{
  const workDir = files.ensureWorkDir(argv.workDir);
  let ctx = null;
  let rollerClient = null;
  if(!argv.useRoller){
    ctx = await eth.createContext(argv);
  }
  else{
    rollerClient = rollerApi.createClient(argv);
  }

  const wallets = argv.useWalletFiles ? findPoints.getWallets(workDir) : null;
  const points = findPoints.getPoints(argv, workDir, wallets);

  const csvHeader = 
    'patp,p,ship_type,parent_patp,master_ticket,network_keyfile,' +
    'dominion,owner_address,spawn_proxy_address,management_proxy_address,' +
    'spawn_transaction,management_proxy_transaction,spawn_proxy_transaction,network_key_transaction,transfer_transaction';
  let csvLines = [csvHeader];

  console.log(`Will process ${points.length} points for the report.`);
  for (const p of points) {
    const patp = ob.patp(p);
    const patpParent = ob.sein(patp);
    const shipType = ob.clan(patp);
    let csvLine = `${patp},${p},${shipType},${patpParent},`;

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

    //use azimuth
    if(!argv.useRoller){
      //get the addresses
      const dominion = 'L1'; //todo: try to get the dominion via ajs
      const ownerAddress = await ajs.azimuth.getOwner(ctx.contracts, p);
      const spawnProxyAddress = await ajs.azimuth.getSpawnProxy(ctx.contracts, p);
      const managementProxyAddress = ''; //does not work yet: await ajs.azimuth.getManagementProxy(ctx.contracts, p);
      csvLine += `${dominion},${ownerAddress},${spawnProxyAddress},${managementProxyAddress},`;
    
      //try to get the transaction receipts
      let spawnTransaction = tryGetTransactionHash(patp, workDir, 'spawn');
      let managementProxyTransaction = tryGetTransactionHash(patp, workDir, 'managementproxy');
      let spawnProxyTransaction = tryGetTransactionHash(patp, workDir, 'spawnproxy');
      let networkkeyTransaction = tryGetTransactionHash(patp, workDir, 'networkkey');
      let transferTransaction = tryGetTransactionHash(patp, workDir, 'transfer');
      csvLine += `${spawnTransaction},${managementProxyTransaction},${spawnProxyTransaction},${networkkeyTransaction},${transferTransaction}`;
    }
    //L2 roller
    else{
      //get the addresses
      const pointInfo = await rollerApi.getPoint(rollerClient, p);
      const dominion = pointInfo.dominion;
      const ownerAddress = pointInfo.ownership.owner.address;
      const spawnProxyAddress = pointInfo.ownership.spawnProxy.address;
      const managementProxyAddress = pointInfo.ownership.managementProxy.address;
      csvLine += `${dominion},${ownerAddress},${spawnProxyAddress},${managementProxyAddress},`;

      //try to get the transaction receipts
      let spawnTransaction = tryGetTransactionHashL2(patp, workDir, 'spawn');
      let managementProxyTransaction = tryGetTransactionHashL2(patp, workDir, 'setManagementProxy');
      let spawnProxyTransaction = tryGetTransactionHashL2(patp, workDir, 'setSpawnProxy');
      let networkkeyTransaction = tryGetTransactionHashL2(patp, workDir, 'configureKeys');
      let transferTransaction = tryGetTransactionHashL2(patp, workDir, 'transferPoint');
      csvLine += `${spawnTransaction},${managementProxyTransaction},${spawnProxyTransaction},${networkkeyTransaction},${transferTransaction}`;
    }
    csvLines.push(csvLine);
  }

  let csvFileName = files.writeFile(workDir, argv.reportFile, csvLines);
  console.log('Wrote CSV file to: '+csvFileName);

}

function tryGetTransactionHash(patp, workDir, operationPostfix){
  const transactionFile = `${patp.substring(1)}-receipt-${operationPostfix}.json`;
    if(files.fileExists(workDir, transactionFile)){
      return files.readJsonObject(workDir, transactionFile).transactionHash;
    }
    return '';
}

function tryGetTransactionHashL2(patp, workDir, method){
  const transactionFile = `${patp.substring(1)}-receipt-L2-${method}.json`;
    if(files.fileExists(workDir, transactionFile)){
      return files.readJsonObject(workDir, transactionFile).hash;
    }
    return '';
}

const DEFAULT_REVISION = 1;
