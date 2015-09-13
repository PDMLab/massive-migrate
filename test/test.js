var Migration = require('../index');
var conn = 'postgresql://postgres:postgres@localhost:5432/postgres';
var should = require('chai').should();
var massive = require('massive');
var _ = require('underscore');


describe('when migrating from an empty database to first version', function () {

    beforeEach(removeTables);

    it('should create pgmigration table', function (done) {
        var migration = new Migration(conn, __dirname + '/migrations', '0.1.0', function () {
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
        var migration = new Migration(conn, __dirname + '/migrations', '0.1.0', function () {
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
        var migration = new Migration(conn, __dirname + '/migrations', '0.1.0', function () {
            migration.up('0.1.0-up', function(err) {
                should.not.exist(err);
                massive.connect({ connectionString : conn}, function(dbErr, db) {
                    var exists = _.any(db.tables, function(table) {
                        return table.name === "salutation"
                    });
                    exists.should.be.true;
                    done();
                });
            });
        });
    })
});

function removeTables(callback) {
    var massive = require('massive');
    massive.connect({ connectionString: conn, scripts: __dirname + '/db'}, function(err, db) {
        if(!err) {
            db.droptables(function(err) {
                if(!err) {
                    callback()
                }else {
                    callback(err)
                }
            })
        }
    })
}