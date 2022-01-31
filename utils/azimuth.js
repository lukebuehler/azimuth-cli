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

module.exports = {
  getChildren,
  isManagementProxy
}

