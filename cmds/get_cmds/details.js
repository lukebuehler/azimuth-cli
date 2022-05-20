const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth, azimuth, rollerApi} = require('../../utils')

exports.command = 'details <point>'
exports.desc = 'Outputs various information about a <point>. Such as owner and proxy addresses.'
exports.builder = (yargs) =>{
}

exports.handler = async function (argv) {
  const ctx = await eth.createContext(argv);
  const p = validate.point(argv.point, true);
  const patp = ob.patp(p);
  console.log(`urbit ID (patp): ${patp}`);
  console.log(`urbit ID number (p): ${p}`);

  const shipType = ob.clan(patp);
  console.log(`ship type: ${shipType}`);

  const dominion = await azimuth.getDominion(ctx.contracts, p);
  console.log(`dominion: ${dominion}`);

  //Careful !!: you cannot check the dominion on l1, because points that are spawned on l2, do not show as spawned at all on l1,
  // you have to ask the roller api to see it as l2
  // example: azi get details bicsev-havwer

  //TODO: show dominion, and start branching based on dominion
  // add command that forces the use of the roller

  // const rollerClient = rollerApi.createClient(argv);
  // const pointInfo = await rollerApi.getPoint(rollerClient, p);
  // console.log(`data from roller:`);
  // console.log(JSON.stringify(pointInfo, null, 2));


  const parentPatp = ob.sein(patp);
  const parentP = ob.patp2dec(parentPatp);
  console.log(`parent: ${parentPatp}`);

  const sponsorP = await ajs.azimuth.getSponsor(ctx.contracts, p);
  const sponsorPatp = ob.patp(sponsorP);
  const hasSponsor = await ajs.azimuth.hasSponsor(ctx.contracts, p);
  console.log(`sponsor: ${hasSponsor ? sponsorPatp : 'null'}`);

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

function sanitizeAddress(address){
  if(address && !ajs.utils.addressEquals('0x0000000000000000000000000000000000000000', address)){
    return address.toLowerCase();
  }
  return null;
}


// data from roller:
// {
//   "dominion": "l1",
//   "ownership": {
//     "transferProxy": {
//       "address": "0x0000000000000000000000000000000000000000",
//       "nonce": 0
//     },
//     "votingProxy": {
//       "address": "0xb73532b04fb598f5d719ec40be68db02f798bcf3",
//       "nonce": 0
//     },
//     "spawnProxy": {
//       "address": "0x9f57c77b1095bd5db0558b9cb9b8e6fc67375e3c",
//       "nonce": 0
//     },
//     "managementProxy": {
//       "address": "0x5eb03d359e6815d6407771ab69e80af5644104b9",
//       "nonce": 0
//     },
//     "owner": {
//       "address": "0x9f57c77b1095bd5db0558b9cb9b8e6fc67375e3c",
//       "nonce": 0
//     }
//   },
//   "network": {
//     "keys": {
//       "life": "6",
//       "suite": "1",
//       "auth": "0xbd44cee24b74632e65d842ce0fc0bf6e109675e6aca4a9d94c33657e1cc24231",
//       "crypt": "0xa5f1a3a6662b675c109be8ce642c1b4add53df18609738b8d59bbc1d8d508831"
//     },
//     "sponsor": {
//       "has": true,
//       "who": 0
//     },
//     "rift": "2"
//   }
// }