exports.command = 'list <command>'
exports.desc = 'List Azimuth points'
exports.builder = function (yargs) {
  return yargs.commandDir('list_cmds')
}
exports.handler = function (argv) {}