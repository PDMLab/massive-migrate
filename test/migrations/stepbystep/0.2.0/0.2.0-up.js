var async = require('async');

exports.up = function(db, callback) {
    async.parallel([
        function(cb) {
            db.createsalutationtable(function(err, result){
                if(err) {
                    console.log('up error while creating salutation table: ', err)
                }
                cb()
            });

        }
    ], function(err, result) {
        callback(err)
    })

};