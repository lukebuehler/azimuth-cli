const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const {validate, eth} = require('../../utils')

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