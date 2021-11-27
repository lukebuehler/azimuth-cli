exports.command = 'generate <command>'
exports.desc = 'Generate spawn lists, master tickets, network keys, and so on.'
exports.builder = function (yargs) {
  return yargs.commandDir('generate_cmds')
}
exports.handler = function (argv) {}