const _ = require('lodash')
const validate = require('./validate')
const files = require('./files')

function getWallets(workDir){
  let walletFiles = files.getFiles(workDir);
  walletFiles = _.filter(walletFiles, f=>f.endsWith('-wallet.json'));
  let wallets = {};
  for (const walletFile of walletFiles) 
    {
      let wallet = files.readJsonObject('', walletFile);
      wallets[wallet.meta.patp] = wallet;
    }
  return wallets;
}

function getPoints(argv, workDir, wallets){
  let pointsRaw = [];
  if(argv.points){
    pointsRaw = argv.points;
  }
  else if(argv.pointsFile){
    pointsRaw = files.readLines(workDir, argv.pointsFile);
  }
  else if(argv.useWalletFiles){
    //wallets is an object with the keys being the p
    pointsRaw = Object.keys(wallets);
  }
  console.log(pointsRaw)
  let points = _(pointsRaw)
    .map(p => validate.point(p, false))
    .reject(_.isNull)
    .value();

  if(!points || points.length == 0){
    console.error('No points provided or found.');
    process.exit(1);
  }
  return points;
}

module.exports = {
  getWallets,
  getPoints
}


