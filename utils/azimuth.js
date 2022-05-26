const ajs = require('azimuth-js')
const _ = require('lodash')

function getChildren(point) {
  let size = ajs.azimuth.getPointSize(point);
  if (size >= ajs.azimuth.PointSize.Planet) {
    return [];
  }
  let childPoints = [];
  let childSpace = (size === ajs.azimuth.PointSize.Galaxy) ? 0x100 : 0x10000;
  for (let i = 1; i < childSpace; i++) {
    let child = point + (i*childSpace);
    childPoints.push(child);
  }
  return childPoints;
}

async function isManagementProxy(contracts, point, address)
{
  if(!ajs.utils.isValidAddress(address)) throw 'address not valid';

  managedPoints = await ajs.azimuth.getManagerFor(contracts, address);
  return _.includes(managedPoints, point.toString());
}

async function getDominion(contracts, point)
{
  //if the ownership or spawn proxy address is set to 0x111...111 on azimuth, then the point is on l2
  const l2address = '0x1111111111111111111111111111111111111111'

  var ownerAddress = await ajs.azimuth.getOwner(contracts, point);
  if(ajs.utils.addressEquals(ownerAddress, l2address))
    return 'l2'
  
  var spawnProxyAddress = await ajs.azimuth.getSpawnProxy(contracts, point);
  if(ajs.utils.addressEquals(spawnProxyAddress, l2address))
    return 'spawn'

  return 'l1'
}

module.exports = {
  getChildren,
  isManagementProxy,
  getDominion
}

