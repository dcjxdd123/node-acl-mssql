var _ = require('lodash');
var async = require('async');
var sql = require('mssql');

var backendDefaults = {
  bucketSize: 100,
  keySize: 100,
  prefix: '',
  table: 'Acl',
  valueSize: 100
};

function Backend(opts) {
  this.opts = _.merge({}, backendDefaults, opts || {});
};

Backend.prototype.add = function (transactions, bucket, key, values) {
  var self = this;
  var query = "INSERT INTO " + this.getTableName() + " SELECT @bucket AS bucket, @key as [key], @value as value WHERE NOT EXISTS (SELECT * FROM acl WHERE bucket = @bucket AND [key] = @key AND value = @value)";
  values = Array.isArray(values) ? values : [values];
  transactions.push(function (done) {
    self.open(function (err, conn) {
      if (err) return done(err);
      async.each(values,
        function (value, done) {
          var req = new sql.Request(conn);
          req.input('bucket', sql.VarChar, bucket);
          req.input('key', sql.VarChar, key);
          req.input('value', sql.VarChar, value);
          req.query(query, done);
        }, function (err) {
          conn.close();
          done(err);
        }
      );
    });
  });
};

Backend.prototype.begin = function () {
  return [];
};

Backend.prototype.clean = function (done) {
  var self = this;
  this.open(function (err, conn) {
    if (err) return done(err);
    var req = new sql.Request(conn);
    var query = "TRUNCATE TABLE " + self.getTableName();
    req.query(query, function (err) {
      conn.close();
      done(err);
    });
  });
};

Backend.prototype.del = function (transactions, bucket, keys) {
  var self = this;
  keys = Array.isArray(keys) ? keys : [keys];
  transactions.push(function (done) {
    self.open(function (err, conn) {
      if (err) return done(err);
      var req = new sql.Request(conn);
      var query = "DELETE FROM " + self.getTableName() + " WHERE bucket = @bucket AND [key] in (";
      req.input('bucket', sql.VarChar, bucket);
      keys.forEach(function (key, i) {
        req.input('key' + i, sql.VarChar, key);
        if (i > 0) query += ',';
        query += '@key' + i;
      });
      query += ")";
      req.query(query, function (err) {
        conn.close();
        done(err);
      });
    });
  });
};

Backend.prototype.end = function (transactions, done) {
  async.parallel(transactions, done);
};

Backend.prototype.get = function (bucket, key, done) {
  var self = this;
  this.open(function (err, conn) {
    if (err) return done(err);
    var req = new sql.Request(conn);
    var query = "SELECT value FROM " + self.getTableName() + " WHERE bucket = @bucket AND [key] = @key";
    req.input('bucket', sql.VarChar, bucket);
    req.input('key', sql.VarChar, key);
    req.query(query, function (err, rows) {
      conn.close();
      if (err) return done(err);
      done(null, _.pluck(rows, 'value'));
    });
  });
};

Backend.prototype.getTableName = function () {
  return this.opts.prefix + this.opts.table;
};

Backend.prototype.open = function (done) {
  var query = "IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '" + this.getTableName() + "') CREATE TABLE " + this.getTableName() + " (bucket VARCHAR(" + this.opts.bucketSize + ") NOT NULL, [key] VARCHAR(" + this.opts.keySize + ") NOT NULL, value VARCHAR(" + this.opts.valueSize + ") NOT NULL, CONSTRAINT " + this.getTableName() + "Constraint UNIQUE (bucket, [key], value))";
  var conn = new sql.Connection(this.opts, function (err) {
    if (err) return done(err);
    var req = new sql.Request(conn);
    req.query(query, function (err) {
      if (!err) return done(null, conn);
      conn.close();
      done(err);
    });
  });
};

Backend.prototype.remove = function (transactions, bucket, key, values) {
  var self = this;
  values = Array.isArray(values) ? values : [values];
  transactions.push(function (done) {
    self.open(function (err, conn) {
      if (err) return done(err);
      var req = new sql.Request(conn);
      var query = "DELETE FROM " + self.getTableName() + " WHERE bucket = @bucket AND [key] = @key AND value in (";
      req.input('bucket', sql.VarChar, bucket);
      req.input('key', sql.VarChar, key);
      values.forEach(function (value, i) {
        req.input('value' + i, sql.VarChar, value);
        if (i > 0) query += ',';
        query += '@value' + i;
      });
      query += ")";
      req.query(query, function (err) {
        conn.close();
        done(err);
      });
    });
  });
};

Backend.prototype.union = function (bucket, keys, done) {
  var self = this;
  this.open(function (err, conn) {
    if (err) return done(err);
    var req = new sql.Request(conn);
    var query = "SELECT DISTINCT value FROM " + self.getTableName() + " WHERE bucket = @bucket AND [key] in (";
    req.input('bucket', sql.VarChar, bucket);
    keys.forEach(function (key, i) {
      req.input('key' + i, sql.VarChar, key);
      if (i > 0) query += ',';
      query += '@key' + i;
    });
    query += ")";
    req.query(query, function (err, rows) {
      conn.close();
      if (err) return done(err);
      done(null, _.pluck(rows, 'value'));
    });
  });
};

module.exports = function (opts) {
  return new Backend(opts);
};
