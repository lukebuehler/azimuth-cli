exports.command = 'children <point>'
exports.desc = 'List children for <point>, where <point> is patp or p.'
exports.builder = {}
exports.handler = function (argv) {
  let p = argv.point;
  console.log('listing children at %s', p);
}