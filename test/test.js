var massiveMigrate = require('../index');
var conn = 'postgresql://postgres:postgres@localhost:5432/postgres';
var should = require('chai').should();
var path = require('path');
var massive = require('massive');
var _ = require('underscore');


describe('when migrating from an empty database to first version', function () {

    beforeEach(removeTables);

    it('should create pgmigration table', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'fromscratch')};
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0'}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.equal(true);
                    done();
                });
            });
        });
    });

    it('should create customer table', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'fromscratch')};
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0'}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "customer"
                    });
                    exists.should.equal(true);
                    done();
                });
            });
        });
    });

    it('should create salutation table', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'fromscratch')}
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0'}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "salutation"
                    });
                    exists.should.equal(true);
                    done();
                });
            });
        });
    });

    it('should pass options user defined options for particular migration to up script', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'fromscratch')}
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0', seedTestData: true}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    db.customer.findOne({companyname1: 'PDMLab e.K.'}, function (err, result) {
                        should.exist(result);
                        done();
                    });

                });
            });
        });
    })
});


describe('when migrating from version 0.1.0 to version 0.2.0', function () {

    beforeEach(removeTables);

    it('should run second migration', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'stepbystep')};
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0'}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.equal(true);

                    migrations.runUpMigration({name: '0.2.0'}, function (err) {
                        should.not.exist(err);
                        massive.connect({connectionString: conn}, function (dbErr, db) {
                            var exists2 = _.any(db.tables, function (table) {
                                return table.name === "salutation"
                            });
                            exists2.should.equal(true);
                            done();
                        });
                    });
                });
            });
        });
    });


    it('should insert second migration to pgmigration table', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'stepbystep')};
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0'}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.equal(true);

                    migrations.runUpMigration({name: '0.2.0'}, function (err) {
                        should.not.exist(err);
                        migrations.hasUpMigration('0.2.0', function (err, hasMigration) {
                            hasMigration.should.equal(true);

                            migrations.getAppliedMigrations(function (err, appliedMigrations) {
                                appliedMigrations.length.should.equal(2);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('should return an error if migration is executed twice', function (done) {
        var options = {connectionString: conn, directory: path.join(__dirname, 'migrations', 'stepbystep')};
        massiveMigrate(options, function (err, migrations) {
            migrations.runUpMigration({name: '0.1.0'}, function (err) {
                should.not.exist(err);
                massive.connect({connectionString: conn}, function (dbErr, db) {
                    var exists = _.any(db.tables, function (table) {
                        return table.name === "pgmigration"
                    });
                    exists.should.equal(true);

                    migrations.runUpMigration({name: '0.2.0'}, function (err) {
                        should.not.exist(err);
                        massive.connect({connectionString: conn}, function (dbErr, db) {
                            migrations.hasUpMigration('0.2.0', function (err, hasMigration) {
                                hasMigration.should.equal(true);

                                migrations.runUpMigration({name: '0.2.0'}, function (err) {
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