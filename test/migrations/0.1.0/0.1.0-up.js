var async = require('async');

exports.up = function(db, callback) {
    async.parallel([
        function(cb) {
            db.createsalutationtable(function(err, result){
                if(err) {
                    console.log('up error: ', err)
                }
                console.log('created salutation', result);
                cb()
            });

        },
        function(cb) {
            db.createcustomertable(function(err, result) {
                if(err) {
                    console.log('up error: ', err)
                }
                console.log('created customers', result);
                cb()
            })
        }
    ], function(err, result) {
        callback(err)
    })

};