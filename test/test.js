var Migration = require('../index');
var conn = 'postgresql://postgres:postgres@localhost:5432/postgres';
var should = require('chai').should();
var massive = require('massive');
var _ = require('underscore');


describe('when migrating from an empty database to first version', function () {

    beforeEach(removeTables);

    it('should create pgmigration table', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations/fromscratch', '0.1.0', function () {
            migration.up('0.1.0-up', function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.be.true;
                    done();
                });
            });
        });
    });

    it('should create customer table', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations/fromscratch', '0.1.0', function () {
            migration.up('0.1.0-up', function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "customer"
                    });
                    exists.should.be.true;
                    done();
                });
            });
        });
    });

    it('should create salutation table', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations/fromscratch', '0.1.0', function () {
            migration.up('0.1.0-up', function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "salutation"
                    });
                    exists.should.be.true;
                    done();
                });
            });
        });
    })
});


describe('when migrating from version 0.1.0 to version 0.2.0', function () {

    beforeEach(removeTables);

    it('should run second migration', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations/stepbystep', '0.1.0', function () {
            migration.up('0.1.0-up', function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.be.true;
                    var migration2 = new Migration(conn, __dirname + '/migrations/stepbystep', '0.2.0', function () {
                        migration2.up('0.2.0-up', function (err) {
                            should.not.exist(err);
                            massive.connect({connectionString: conn}, function (dbErr, db) {
                                var exists2 = _.any(db.tables, function (table) {
                                    return table.name === "salutation"
                                });
                                exists2.should.be.true;
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('should insert second migration to pgmigration table', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations/stepbystep', '0.1.0', function () {
            migration.up('0.1.0-up', function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.be.true;
                    var migration2 = new Migration(conn, __dirname + '/migrations/stepbystep', '0.2.0', function () {
                        migration2.up('0.2.0-up', function (err) {
                            should.not.exist(err);
                            massive.connect({connectionString: conn}, function (dbErr, db) {
                                db.pgmigration.findOne({ version: '0.2.0'}, function(err, result) {
                                    result.should.not.be.null;
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    })

    it('should return an error if migration is executed twice', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations/stepbystep', '0.1.0', function () {
            migration.up('0.1.0-up', function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.be.true;
                    var migration2 = new Migration(conn, __dirname + '/migrations/stepbystep', '0.2.0', function () {
                        migration2.up('0.2.0-up', function (err) {
                            should.not.exist(err);
                            massive.connect({connectionString: conn}, function (dbErr, db) {
                                db.pgmigration.findOne({ version: '0.2.0'}, function(err, result) {
                                    result.should.not.be.null;
                                    var migration2double = new Migration(conn, __dirname + '/migrations/stepbystep', '0.2.0', function () {
                                        migration2double.up('0.2.0-up', function (err) {
                                            should.exist(err);
                                            err.should.equal('Migration has been applied already');
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    })
});

function removeTables(callback) {
    var massive = require('massive');
    massive.connect({connectionString: conn, scripts: __dirname + '/db'}, function (err, db) {
        if (!err) {
            db.droptables(function (err) {
                if (!err) {
                    callback()
                } else {
                    callback(err)
                }
            })
        }
    })
}