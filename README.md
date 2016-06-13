# massive-migrate

Massive-Migrate is a small migrations library based on [Massive-js](https://github.com/robconery/massive-js) that can help you implement migrations for Postgres databases using Node.js.

## Installation

```bash
npm install massive-migrate --save
```

## Usage

Once installed, you can use it by calling the `runUpMigration` function of a `Migrations` instance you've created before:

```js
var massiveMigrate = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = path.join(__dirname,'/migrations');
var name = '0.1.0';
var options =  {
	connectionString : conn,
	directory : migrationsDirectory
}

massiveMigrate(options, function (err, migrations) {
    if (err) { 
        return console.log('migration error', err)
    }
    
    migrations.runUpMigration({ name : name }, function(err) {
        if(!err) {
        	console.log('migration done');
        }
    });
});
```

Simple migrations can be a single file (like `0.1.0`-up.sql).  For situations where additional coding logic for each migration or multiple SQL migrations per `version` are required a directory can be created to hold up migrations and a `<name>-up.js` migration script.

#### Simple Migrations

The simple migration directory layout for your `migrationsDirectory` will be like:

```
├── migrations
│    └── 0.1.0-up.sql
│    └── 0.2.0-up.sql
└── app.js
```

The migration file's name can be whatever you like but must end in `-up.sql` and should contain standard postgres SQL.  An example app.js to run these migrations could look like:

```js
var massiveMigrate = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = path.join(__dirname,'/migrations');
var options =  {
	connectionString : conn,
	directory : migrationsDirectory
}

massiveMigrate(options, function () {
    migrations.runUpMigration({ name : '0.1.0' }, function(err) {
        if(err) {
            console.log("Error running migration", err);
            return;
        }
        migrations.runUpMigration({ name : '0.2.0' }, function(err) {
            if(err) {
                console.log("Error running migration", err);
                return;
            }
            console.log('Migrations successfully applied!');
        }
    });
});
```


#### Advanced Migrations

For the second case where you want more control over the migrations or additional migration files per `version` you'll create a directory to hold the SQL migration files and a script to execute them.  For example, if want to do an `up`-migration to version `0.1.0`, you must have a directory `0.1.0` in your `migrationsDirectory`.

```
├── migrations
│    └── 0.1.0
└── app.js
```

The parameter for the `up` function is an options object containing at least the name of the migration that should be run. The order of the operations to be done during the `0.1.0` `up` migration is defined in a script whose name by convention is `name` of the migration + `up.js`. Thus for the up migration `0.1.0` it is `0.1.0-up.js`.

The migration script has to reside below the `0.1.0` folder shown in the the tree above:

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

The final piece for our migration is the implementation of the migration script named `0.1.0-up.js` which gets hooked up for the migration by Massive-Migrate:

```js
var async = require('async');

exports.up = function(db, options, callback) {
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
created salutation table
created customer table
migration done
```

Your database now contains the two tables as well as a table `pgmigrations`:


```
│    id    │   name    │  scriptname  │  dateapplied  │
├──────────┼───────────┼──────────────┼───────────────┤
│  <guid>  │   0.1.0   │   0.1.0-up   │    <date>     │
```

## Running a series of migrations
If you want to run more than one migration, you can just follow the convention and provide multiple migrations, each having their folder containing the `.SQL` files and their up script.

Then you can run them in a series like this:

```js
var massiveMigrate = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = path.join(__dirname,'/migrations');
var options =  {
	connectionString : conn,
	directory : migrationsDirectory
}

massiveMigrate(options, function () {
    migrations.runUpMigration({ name : '0.1.0' }, function(err) {
        if(!err) {
          migrations.runUpMigration({ name : '0.2.0' }, function(err) {
        	  console.log('migration done');
        	}
        }
    });
});
```

## Passing custom params to the up script
If you want to pass custom params to the up script when calling the `runUpMigration` function, you can do so.

Just apply your custom params to the options object like shown with the `seedTestData` param:

```js
var massiveMigrate = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = path.join(__dirname,'/migrations');
var name = '0.1.0';
var options =  {
	connectionString : conn,
	directory : migrationsDirectory
}

massiveMigrate(options, function () {
    migrations.runUpMigration({ name : name, seedTestData : true }, function(err) {
        if(!err) {
        	console.log('migration done');
        }
    });
});
```

In your `up`-script you can simply access the `seedTestData` param via the `options` param being passed in to the `up` function:


```js
exports.up = function(db, options, callback) {
    async.parallel([
        function(cb) {
            db.createsalutationtable(function(err, result){
                if(err) {
                    console.log('up error while creating salutation table: ', err)
                }
                cb()
            });

        },
        function(cb) {
            db.createcustomertable(function(err, result) {
                if(err) {
                    console.log('up error while creating customer table: ', err)
                    cb();
                }
                else {
                    if(options.seedTestData) {
                        db.seedcustomertestdata(function(err) {
                            cb();
                        })
                    } else {
                        cb();
                    }
                }
            })
        }
    ], function(err, result) {
        callback(err)
    })
};
```

## Does a migration already exist? 
If you want to know if a migration has been applied already, you can ask the migrations:

```js
var massiveMigrate = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = path.join(__dirname,'/migrations');
var name = '0.1.0';
var options =  {
	connectionString : conn,
	directory : migrationsDirectory
}

massiveMigrate(options, function () {
    migrations.hasUpMigration(name, function(err, result) {
        if(!err) {
        	console.log('migration exists', result); // true or false
        }
    });
});
```

If you're trying to run a migration that has been already applied, you'll get receive an error:

`'Migration has been applied already'`

For more details, please take a look at the tests.

## Get all applied migrations
If you need details (`id`, `name`, `scriptname` and `dateapplied`) about all applied migrations, just call the `getAppliedMigrations` function:

```js
var massiveMigrate = require("massive-migrate");
var conn = "postgresql://postgres:postgres@localhost:5432/postgres";
var migrationsDirectory = path.join(__dirname,'/migrations');
var options =  {
	connectionString : conn,
	directory : migrationsDirectory
}

massiveMigrate(options, function () {
    migrations.runUpMigration({ name : '0.1.0' }, function(err) {
        if(err) {
            console.log("Error running migration", err);
            return;
        }
        migrations.runUpMigration({ name : '0.2.0' }, function(err) {
            if(err) {
                console.log("Error running migration", err);
                return;
            }
            console.log('Migrations successfully applied!');
        }
    });
});
```

## Running the tests
You can choose two variants to run the tests: against a local Postgres installation or using Postgres in a Docker container.

Without Docker, create a local Postgres database named `postgres` with username and password `postgres`, listening on `localhost:5432`.

Then, run the tests:
```bash
npm test
```

If you want to use Docker with no local Postgres installation required, run your tests like this:

```
npm run dockerpostgres
npm test
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
