var lib = require('./');
var tests = require('acl/test/tests');

before(function (done) {
  var self = this;

  var conf = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE
  };

  lib(conf, function (err, backend) {
    if (err) return console.error(err);
    self.backend = backend;
    done();
  });
});

for (test in tests) {
  tests[test]();
}
