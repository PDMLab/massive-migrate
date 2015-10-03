var async = require('async');

exports.up = function(db, options, callback) {
    async.parallel([
        function(cb) {
            db.createcustomertable(function(err, result) {
                if(err) {
                    console.log('up error while creating customer table: ', err)
                }
                cb()
            })
        }
    ], function(err, result) {
        callback(err)
    })

};