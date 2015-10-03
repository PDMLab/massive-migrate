var async = require('async');

exports.up = function(db, options, callback) {
    async.parallel([
        function(cb) {
            db.createsalutationtable(function(err, result){
                if(err) {
                    console.log('up error while creating salutation table: ', err)
                }
                cb()
            });

        },
        function(cb) {
            db.createcustomertable(function(err, result) {
                if(err) {
                    console.log('up error while creating customer table: ', err)
                    cb();
                }
                else {
                    if(options.seedTestData) {
                        db.seedcustomertestdata(function(err) {
                            cb();
                        })
                    } else {
                        cb();
                    }
                }
            })
        }
    ], function(err, result) {
        callback(err)
    })
};