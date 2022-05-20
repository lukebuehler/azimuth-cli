exports.command = 'get <command>'
exports.desc = 'Retrieve information about Urbit points, L2 rollers, and Ethereum gas prices.'
exports.builder = function (yargs) {
  return yargs.commandDir('get_cmds')
}
exports.handler = function (argv) {}