exports.command = 'list-l2 <command>'
exports.desc = 'Azimuth layer 2 commands for retriving infromation about points, addresses, and roller.'
exports.builder = function (yargs) {
  return yargs.commandDir('list-l2_cmds')
}
exports.handler = function (argv) {}