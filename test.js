var lib = require('./');
var tests = require('acl/test/tests');

before(function () {
  this.backend = lib({
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE
  });
});

for (test in tests) {
  tests[test]();
}
