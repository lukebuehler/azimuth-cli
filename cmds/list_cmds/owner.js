exports.command = 'owner <addr>'
exports.desc = 'List points of which the <addr> is owner.'
exports.builder = {}
exports.handler = function (argv) {
  let addr = argv.addr;
  console.log('listing all points of owner %s', addr);
}