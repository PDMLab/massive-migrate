var massive = require('massive');
var async = require('async');
var fs = require('fs');
var path = require('path');

var temp = require('temp');

temp.track();

var migrations = function (options) {
    this.options = options;
    this.database = options.database;

};

migrations.prototype.hasUpMigration = function (name, callback) {
    this.database.pgmigration.findOne({
        name: name,
        scriptname: name + '-up'
    }, function (err, result) {
        callback(err, !!result)
    });
};

migrations.prototype.getAppliedMigrations = function (callback) {
    this.database.pgmigration.find({}, function (err, appliedMigrations) {
        callback(err, appliedMigrations);
    })
};

migrations.prototype.runUpMigration = function (options, callback) {
    var that = this;
    this.hasUpMigration(options.name, function (err, result) {
        if (!result) {
            var migrationOptions = options;
            options.connectionString = that.options.connectionString;
            options.directory = that.options.directory;
            runUpMigration(migrationOptions, callback)
        } else {
            callback('Migration has been applied already')
        }
    })
};


function runUpMigration(options, callback) {
    var conn = options.connectionString;
    var script = options.name + '-up';
    var directory = options.directory;
    var name = options.name;
    var upDir = path.join(directory,name,'up');
    copySqlFilesToTempDir(upDir, function (err, tempDir) {
        massive.connect({connectionString: conn, scripts: tempDir}, function (err, database) {
            var upscript = require(path.join(directory,name,script));
            upscript.up(database, options, function (err) {
                if (!err) {
                    database.pgmigration.insert({
                        name: name,
                        scriptname: script
                    }, function (err) {
                        if (!err) {
                            temp.cleanup();
                            if (callback) {
                                callback()
                            }
                        } else {
                            if (callback) {
                                callback(err)
                            }
                        }
                    })
                }
            })
        });
    });
}



function copySqlFilesToTempDir(upDir, callback) {
    fs.readdir(upDir, function (err, result) {
        temp.mkdir('massive-migrate', function (err, tempDir) {
            async.each(result, function (sqlFile, callback) {
                copyFile(path.join(upDir,sqlFile), path.join(tempDir,sqlFile), callback)
            }, function (err) {
                if (!err) {
                    callback(null, tempDir);
                }
            })
        })
    });
}

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

module.exports = migrations;
