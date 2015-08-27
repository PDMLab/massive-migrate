# massive-migrate

Massive-Migrate is a small migrations library based on [Massive-js](https://github.com/robconery/massive-js) that can help you implement migrations for Postgres databases using Node.js.

## Installation

```bash
npm install massive-migrate --save
```

## Usage

Once installed, you can use it by calling the `up` function of a `Migration` instance you've created before:

```js
var Migration = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = __dirname + "/migrations";
var version = '0.1.0';
var migrationScript = '0.1.0-up';

var migration = new Migration(conn, migrationsDirectory, version, function () {
    migration.up(migrationScript);
});
```

Assuming you want to do an `up`-migration to version `0.1.0`, you must have a folder `0.1.0` in your `migrationsDirectory`.

```
├── migrations
│    └── 0.1.0
└── app.js
```

The parameter for the `up` function is the name of the `migrationScript` that defines the order of the operations to be done during the `0.1.0` `up` migration.

The `migrationScript` has to reside below the `0.1.0` folder shown in the the tree above:

```
├── migrations
│    └── 0.1.0
│      └── 0.1.0-up.js
└── app.js
```

As the core idea of [Massive-js](https://github.com/robconery/massive-js) (on top of which Massive-Migrate is build) is the usage of `.SQL` files, the migrations themselve are written in `.SQL` files as well.

In our `0.1.0` `up` migration we want to create a table `customer` using the `createcustomertable.sql` file:

```SQL
BEGIN;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS Customer (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companyname1 VARCHAR(40),
  companyname2 VARCHAR(40),
  addressline1 VARCHAR(40),
  addressline2 VARCHAR(40),
  zipcode VARCHAR(10),
  city VARCHAR(40),
  salestaxidentificationnumber VARCHAR(14),
  createdat DATE DEFAULT now()
);
END;
```

We also want to create a `salutation` table using the `createsalutationtable.sql` file:

```SQL
BEGIN;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS salutation (
  ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salutation VARCHAR(40),
  male BOOL,
  female BOOL,
  genderless BOOL,
  createdat DATE DEFAULT now()
);
END;
```

Both `.SQL` files have to be in the `up` folder below your `0.1.0` migration folder:

```
├── migrations
│    └── 0.1.0
│         ├── up
│         │    ├── createcustomertable.sql
│         │    └── createsalutationtable.sql
│         └── 0.1.0-up.js
└── app.js
```

The final piece for our migration is the implementation of the `migrationScript` named `0.1.0-up.js` which gets hooked up for the migration by Massive-Migrate:

```js
var async = require('async');

exports.up = function(db, callback) {
    async.parallel([
        function(cb) {
            db.createsalutationtable(function(err, result){
                if(err) {
                    console.log('up error while creating salutation table: ', err)
                }
                console.log('created salutation table', result);
                cb()
            });

        },
        function(cb) {
            db.createcustomertable(function(err, result) {
                if(err) {
                    console.log('up error while creating customer table: ', err)
                }
                console.log('created customer table', result);
                cb()
            })
        }
    ], function(err, result) {
        callback(err)
    })

};
```

If you run your application which calls the migration, you get this output:

```bash`
$ node app.js
migration done
```

Your database now contains the two tables as well as a table `pgmigrations`:


```

│    id    │  version  │  scriptname  │  dateapplied  │
├──────────┼───────────┼──────────────┼───────────────┤
│  <guid>  │   0.1.0   │   0.1.0-up   │    <date>     │

```

## Want to help?
This project is just getting off the ground and could use some help with cleaning things up and refactoring.

If you want to contribute - we'd love it! Just open an issue to work against so you get full credit for your fork. You can open the issue first so we can discuss and you can work your fork as we go along.

If you see a bug, please be so kind as to show how it's failing, and we'll do our best to get it fixed quickly.

## License (BSD 3-Clause)

Copyright (c) 2015, PDMLab e.K.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of massive-migrate nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
