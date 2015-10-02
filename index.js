var Migrations = require('./lib/migrations');
var massive = require('massive');
var path = require('path');

var libDir = path.join(__dirname, 'lib', 'db');

var massiveMigrate = function(options, callback) {

    massive.connect({connectionString: options.connectionString, scripts: libDir}, function (err, db) {
        if (!err) {
            ensureMigrationTableExists(db, function(err) {
                if (!err) {
                    massive.connect(db, function (err, db) {
                        var migrationsOptions = options;
                        migrationsOptions.database = db;
                        var migrations = new Migrations(migrationsOptions);
                        callback(null, migrations)
                    })
                }
            })
        }
    });
};

function ensureMigrationTableExists(db, done) {
    var migrationTableExist = false;
    for (var i = 0; i < db.tables.length; i++) {
        if (db.tables[i].name === 'pgmigration') {
            migrationTableExist = true;
        }
    }
    if (!migrationTableExist) {
        db.createpgmigrationtable(function (err) {
            done(err);
        });
    } else {
        done();
    }
}


module.exports = massiveMigrate;