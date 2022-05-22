const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth, azimuth, rollerApi} = require('../../utils')

exports.command = 'details <point>'
exports.desc = 'Outputs various information about a <point>. Such as owner and proxy addresses.'
exports.builder = (yargs) =>{
  yargs.option('use-roller',{
    describe: 'Enforce using the roller (L2) for all data and do not allow fallback to azimuth (L1).',
    type: 'boolean',
    conflicts: 'use-azimuth'
  });
  yargs.option('use-azimuth',{
    describe: 'Enforce using azimuth (L1) for all data and do not allow fallback to the roller (L2).',
    type: 'boolean',
    conflicts: 'use-roller'
  });
}

exports.handler = async function (argv) {
  const p = validate.point(argv.point, true);
  const source = await rollerApi.selectDataSource(argv);

  //print some info that does not require a connection to azimuth or the roller
  const patp = ob.patp(p);
  console.log(`urbit ID (patp): ${patp}`);
  console.log(`urbit ID number (p): ${p}`);
  const shipType = ob.clan(patp);
  console.log(`ship type: ${shipType}`);
  const parentPatp = ob.sein(patp);
  const parentP = ob.patp2dec(parentPatp);
  console.log(`parent: ${parentPatp}`);

  //depending on the data source, print info from azimuth or the roller
  if(source == 'azimuth'){
    await printDetailsFromL1(argv, p);
  }
  else{
    await printDetailsFromL2(argv, p);
  }
}

function sanitizeAddress(address){
  if(address && !ajs.utils.addressEquals('0x0000000000000000000000000000000000000000', address)){
    return address.toLowerCase();
  }
  return null;
}

async function printDetailsFromL1(argv, p){
  const ctx = await eth.createContext(argv);

  const sponsorP = await ajs.azimuth.getSponsor(ctx.contracts, p);
  const sponsorPatp = ob.patp(sponsorP);
  const hasSponsor = await ajs.azimuth.hasSponsor(ctx.contracts, p);
  console.log(`sponsor: ${hasSponsor ? sponsorPatp : 'null'}`);

  const dominion = await azimuth.getDominion(ctx.contracts, p);
  console.log(`dominion: ${dominion}`);

  const ownerAddress = sanitizeAddress(await ajs.azimuth.getOwner(ctx.contracts, p));
  console.log(`owner address: ${ownerAddress}`);

  const spawnProxyAddress = sanitizeAddress(await ajs.azimuth.getSpawnProxy(ctx.contracts, p));
  console.log(`spawn proxy address: ${spawnProxyAddress}`);

  const networkKeysSet = await ajs.azimuth.hasBeenLinked(ctx.contracts, p);
  console.log(`network keys set: ${networkKeysSet}`);
  const networkKeysRevision = await ajs.azimuth.getKeyRevisionNumber(ctx.contracts, p);
  console.log(`network keys revision: ${networkKeysRevision}`);

  const continuityNumber = await ajs.azimuth.getContinuityNumber(ctx.contracts, p);
  console.log(`continuity number: ${continuityNumber}`);

  const spawnedChildrenCount = await ajs.azimuth.getSpawnCount(ctx.contracts, p);
  console.log(`spawned children: ${spawnedChildrenCount}`);
}

async function printDetailsFromL2(argv, p){
  const rollerClient = rollerApi.createClient(argv);

  let pointInfo = null
  try{
    pointInfo = await rollerApi.getPoint(rollerClient, p);
  }
  catch(error){
    if(error.message.includes('Resource not found')){
      console.log('planet does not exist on L2, please try again with the --use-azimuth option.')
    }
    else{
      console.log(error);
    }
    return;
  }

  const sponsorP = Number(pointInfo.network.sponsor.who);
  const sponsorPatp = ob.patp(sponsorP);
  const hasSponsor = pointInfo.network.sponsor.has;
  console.log(`sponsor: ${hasSponsor ? sponsorPatp : 'null'}`);

  console.log(`dominion: ${pointInfo.dominion}`);

  console.log(`owner address: ${pointInfo.ownership.owner.address}`);
  console.log(`spawn proxy address: ${pointInfo.ownership.spawnProxy.address}`);
  console.log(`management proxy address: ${pointInfo.ownership.managementProxy.address}`);
  console.log(`transfer proxy address: ${pointInfo.ownership.transferProxy.address}`);

  console.log(`network keys set: ${pointInfo.network.keys.auth ? 'true' : 'false'}`);
  console.log(`network keys revision (life): ${pointInfo.network.keys.life}`);
  
  console.log(`continuity number (rift): ${pointInfo.network.rift}`);

  const spawnedChildren = await rollerApi.getSpawned(rollerClient, p);
  console.log(`spawned children: ${spawnedChildren.length}`);
}