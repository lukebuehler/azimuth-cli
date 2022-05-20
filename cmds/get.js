exports.command = 'get <command>'
exports.desc = 'Get information about Urbit points.'
exports.builder = function (yargs) {
  return yargs.commandDir('get_cmds')
}
exports.handler = function (argv) {}