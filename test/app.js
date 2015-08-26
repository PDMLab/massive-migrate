var Migration = require('../index');
var conn = 'postgresql://postgres:postgres@localhost:5432/postgres';


var migration = new Migration(conn, __dirname + '/migrations', '0.1.0', function () {
    migration.up('0.1.0-up');
});