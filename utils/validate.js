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
 * Parses a point input
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

module.exports = {
  point
}

