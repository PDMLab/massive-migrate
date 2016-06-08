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

migrations.prototype.hasUpMigrationBeenApplied = function (name, callback) {
    this.database.pgmigration.findOne({
        name: name,
        scriptname: name + '-up'
    }, function (err, result) {
        callback(err, !!result)
    });
}

// Provides backwards compatibility
migrations.prototype.hasUpMigration = function () {
    this.hasUpMigrationBeenApplied.apply(this, Array.prototype.slice.call(arguments));
}

migrations.prototype.getAppliedMigrations = function (callback) {
    this.database.pgmigration.find({}, function (err, appliedMigrations) {
        callback(err, appliedMigrations);
    });
}

migrations.prototype.runUpMigration = function (options, callback) {
    var that = this;
    this.hasUpMigrationBeenApplied(options.name, function (err, result) {
        if (!result) {
            var migrationOptions = options;
            options.connectionString = that.options.connectionString;
            options.directory = that.options.directory;
            runUpMigration(migrationOptions, callback);
        } else {
            callback('Migration has been applied already');
        }
    });
}


function runUpMigration(options, callback) {
    // If a callback is not provided declare an empty method to avoid checks
    if (! callback) { callback = function() {} }

    var conn = options.connectionString;
    var script = options.name + '-up';
    var directory = options.directory;
    var name = options.name;
    var upDir = path.join(directory,name,'up');

    fs.access(upDir, fs.F_OK, function(err) {
        if (err) {
            // Migration directory doesn't exist. Proceed as if this is a migration in a file that doesn't use directories
            var sqlScriptFileName = path.join(directory, name) + '-up.sql';
            fs.readFile(sqlScriptFileName, 'utf8', function (err, data) {
                if (err) return callback(err);

                massive.connect({connectionString: conn}, function (err, database) {
                    if (err) return callback(err);

                    database.run(data, function(err, result){
                        if (err) return callback(err);

                        persistExecutedMigration(database, name, script, function(err) {
                            temp.cleanup();
                            return callback(err);
                        });
                    });
                });
            });
        } else {
            // Found the directory proceed with running the up script
            copySqlFilesToTempDir(upDir, function (err, tempDir) {
                if (err) return callback(err);

                massive.connect({connectionString: conn, scripts: tempDir}, function (err, database) {
                    if (err) return callback(err);

                    var upscript = require(path.join(directory,name,script));
                    upscript.up(database, options, function (err) {
                        if (err) return callback(err);

                        persistExecutedMigration(database, name, script, function(err) {
                            temp.cleanup();
                            return callback(err);
                        });
                    });
                });
            });
        }
    });
}

function persistExecutedMigration(database, name, script, callback) {
    database.pgmigration.insert({
        name: name,
        scriptname: script
    }, function (err) {
        callback(err);
    });
}

function copySqlFilesToTempDir(upDir, callback) {
    fs.readdir(upDir, function (err, result) {
        if (err) return callback(err);

        temp.mkdir('massive-migrate', function (err, tempDir) {
            if (err) return callback(err);

            async.each(result, function (sqlFile, callback) {
                copyFile(path.join(upDir,sqlFile), path.join(tempDir,sqlFile), callback)
            }, function (err) {
                if (err) return callback(err);

                callback(null, tempDir);
            });
        });
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
