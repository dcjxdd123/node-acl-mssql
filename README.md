node acl mssql backend
======================

A mssql [node_acl](https://github.com/OptimalBits/node_acl) backend. Refer to [node mssql](https://www.npmjs.com/package/mssql) for connection options.

Installation
------------

    npm install acl-mssql --save

Usage
-----

    var Acl = require('acl');
    var backend = require('acl-mssql');

    var acl = new Acl(backend({
      user: '...',
      password: '...',
      server: 'localhost',
      database: '...'
    }));

    acl.allow('guest', 'blogs', 'view');
    acl.allow('member', 'blogs', ['edit', 'view', 'delete']);

Options
-------

In addition to mssql connection options:

**prefix** - Optional table prefix name.

**table** - Table name. Defaults to **Acl**.

**bucketSize** - Length of the bucket column. Defaults to **100**.

**keySize** - Length of the key column. Defaults to **100**.

**valueSize** - Length of the value column. Defaults to **100**.
