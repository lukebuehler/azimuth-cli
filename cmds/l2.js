exports.command = 'l2 <command>'
exports.desc = 'Azimuth Layer 2 Commands'
exports.builder = function (yargs) {
  return yargs.commandDir('l2_cmds')
}
exports.handler = function (argv) {}