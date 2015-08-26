var massive = require('massive');
var fs = require('fs');
var async = require('async');
var temp = require('temp');

temp.track();


var database;

var Migration = function (conn, migrationsDirectory, version, done) {

    var self = this;
    console.log(__dirname);
    console.log('Migrations directory', migrationsDirectory);
    console.log(conn);

    massive.connect({connectionString: conn, scripts: __dirname + '/lib/db/'}, function (err, db) {

        var migrationTableExist = false;
        for (var i = 0; i < db.tables.length; i++) {
            if (db.tables[i].name === 'pgmigration') {
                migrationTableExist = true;
            }
        }
        console.log('migration table exists: ', migrationTableExist);
        if (!migrationTableExist) {
            db.createpgmigrationtable(function (err, res) {
                console.log(err);
                database = db;
                done();
            });
        } else {
            done();
        }
    });

    self.up = function (script) {
        console.log('up');
        var upDir = migrationsDirectory + '/' + version + '/up';
        fs.readdir(upDir, function (err, result) {
            temp.mkdir('massive-migrate', function(err, tempDir) {
                console.log('tempdir', tempDir)
                async.each(result, function (file, callback) {
                    copyFile(upDir + '/' + file, tempDir + '/' + file, callback)
                }, function (err) {
                    if (!err) {
                        massive.connect({connectionString: conn, scripts: tempDir}, function (err, db) {
                            var upscript = require(migrationsDirectory + '/' + version + '/' + script);
                            upscript.up(db, function (err) {
                                if (!err) {
                                    console.log('done up');
                                    db.pgmigration.insert({
                                        version: version,
                                        scriptname: script
                                    }, function (err) {
                                        if (!err) {
                                            console.log('migration done');
                                            temp.cleanup();
                                        } else {
                                            console.log('migration insert error ', err)
                                        }
                                    })
                                }

                            });
                        })
                    }
                });
            });
        });
    }
};

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

module.exports = Migration;