const ob = require('urbit-ob')
const ajs = require('azimuth-js')
const chalk = require('chalk')

function exitBecauseInvalid(paramName, msg){
  let errorMessage = `'${paramName}' is not valid.`
  if(msg)
    errorMessage += " "+msg;
  console.error(chalk.red(errorMessage));
  process.exit(1);
}

/**
 * Validate a point input and retrurn the p value
 * @param {(Number|String)} point - A valid Urbit ID point as p or patp.
 * @param {Boolean} [required] - If the the program should exit when the parsing fails.
 * @returns {Number} Point as p. 
 */
function point(point, required)
{
  if(typeof point === 'number' && Number.isInteger(point))
  { 
    if(ajs.check.isPoint(point))
      return Number(point);
    return null;
  }

  if (typeof point === 'string')
  {
    if(!point.startsWith('~'))
      point = '~'+point;
    if(ob.isValidPatp(point))
      return Number(ob.patp2dec(point));
  }

  if(required)
    exitBecauseInvalid('point', "Provide a valid p ('0', '39424') or patp ('~zod', '~tilzod').")
  return null;
}

/**
 * Validate an Ethereum address
 * @param {(Number|String)} address - A valid ethereum address.
 * @param {Boolean} [required] - If the the program should exit when the parsing fails.
 * @returns {String} The address with a hex prefix. 
 */
function address(address, required)
{
  if(typeof address === 'number'){
    address = '0x'+address.toString(16);
  }
  address = ajs.utils.addHexPrefix(address);

  if(ajs.utils.isValidAddress(address))
  {
    return address;
  }
  else if(required){
    exitBecauseInvalid('address', "Provide a valid ethereum address.")
  }
  return null;
}


module.exports = {
  point,
  address,
}

