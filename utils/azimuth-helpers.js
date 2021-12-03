const ajs = require('azimuth-js')
const Web3 = require('web3')

//this function is copied here from azimuth-js
//here is the issue: https://github.com/urbit/azimuth-js/issues/80
async function getUnspawnedChildren(contracts, point) {
  let size = ajs.azimuth.getPointSize(point);
  if (size >= ajs.azimuth.PointSize.Planet) {
    return [];
  }
  //this is an array of strings (not sure why, it shouldn't be)
  let spawned = await ajs.azimuth.getSpawned(contracts, point);
  // console.log(spawned);
  let unspawned = [];
  let childSpace = (size === ajs.azimuth.PointSize.Galaxy) ? 0x100 : 0x10000;
  for (let i = 1; i < childSpace; i++) {
    let child = point + (i*childSpace);
    //then this comparison fails unless child is cast to string
    if (spawned.indexOf(child.toString()) < 0) {
      unspawned.push(child);
    }
  }
  return unspawned;
}

module.exports = {
  getUnspawnedChildren
}

