exports.command = 'spawn <parent> <child>'
exports.desc = 'Spawn children from parent'
exports.builder = {
  dir: {
    default: '.'
  }
}
exports.handler = function (argv) {
  console.log('spawning points')
}