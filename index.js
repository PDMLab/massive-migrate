var massive = require('massive');
var fs = require('fs');
var async = require('async');
var temp = require('temp');

temp.track();


var database;

var Migration = function (conn, migrationsDirectory, version, done) {

    var self = this;

    massive.connect({connectionString: conn, scripts: __dirname + '/lib/db/'}, function (err, db) {

        var migrationTableExist = false;
        for (var i = 0; i < db.tables.length; i++) {
            if (db.tables[i].name === 'pgmigration') {
                migrationTableExist = true;
            }
        }
        if (!migrationTableExist) {
            db.createpgmigrationtable(function (err, res) {
                database = db;
                done();
            });
        } else {
            done();
        }
    });

    self.up = function (script, callback) {
        var upDir = migrationsDirectory + '/' + version + '/up';
        fs.readdir(upDir, function (err, result) {
            temp.mkdir('massive-migrate', function(err, tempDir) {
                async.each(result, function (file, callback) {
                    copyFile(upDir + '/' + file, tempDir + '/' + file, callback)
                }, function (err) {
                    if (!err) {
                        massive.connect({connectionString: conn, scripts: tempDir}, function (err, db) {
                            var upscript = require(migrationsDirectory + '/' + version + '/' + script);
                            upscript.up(db, function (err) {
                                if (!err) {
                                    db.pgmigration.insert({
                                        version: version,
                                        scriptname: script
                                    }, function (err) {
                                        if (!err) {
                                            temp.cleanup();
                                            if(callback) {
                                                callback()
                                            }
                                        } else {
                                            if(callback) {
                                                callback(err)
                                            }
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