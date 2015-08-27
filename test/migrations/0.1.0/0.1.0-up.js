var async = require('async');

exports.up = function(db, callback) {
    async.parallel([
        function(cb) {
            db.createsalutationtable(function(err, result){
                if(err) {
                    console.log('up error while creating salutation table: ', err)
                }
                console.log('created salutation table', result);
                cb()
            });

        },
        function(cb) {
            db.createcustomertable(function(err, result) {
                if(err) {
                    console.log('up error while creating customer table: ', err)
                }
                console.log('created customer table', result);
                cb()
            })
        }
    ], function(err, result) {
        callback(err)
    })

};