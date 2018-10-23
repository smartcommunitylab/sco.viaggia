angular.module('viaggia.services.taxi', [])

/**
 * A SERVICE TO WORK WITH PARKING DATA FROM SERVER
 */
.factory('taxiService', function ($http, $q, $filter, Config, GeoLocate) {
    var cacheCompanies = {};
    var cacheTaxiPoints = {};
    //
    //    var generateId = function (name) {
    //        return name ? name.replace('/', '_') : '_';
    //    };
    //
    //    var getFromCacheCompanies = function (agencyId, parkingId, deferred) {
    //        for (var i = 0; i < cacheCompanies[agencyId].length; i++) {
    //            if (cacheCompanies[agencyId][i].id == parkingId) {
    //                deferred.resolve(cacheCompanies[agencyId][i]);
    //                return;
    //            }
    //        }
    //        deferred.resolve(null);
    //    }
    return {
        getCompanies: function (appId, agencyId) {
            var deferred = $q.defer();
            //            $http.get(Config.getServerURL() + '/bikesharing/' + agencyId,
            if (!cacheCompanies.length || cacheCompanies.length === 0) {
                $http.get(Config.getServerURL() + '/getTaxiAgencyContacts/',
//                $http.get("https://tn.smartcommunitylab.it/smart-planner2/trentino/rest/taxi/contacts", //tmp
                        Config.getHTTPConfig())
                    .success(function (data) {
                        if (data) {
                            var all = [];
                            cacheCompanies = data;
                            deferred.resolve(data);

                        } else {
                            deferred.resolve(data);
                        }
                    })
                    .error(function (err) {
                        deferred.reject(err);
                    });
            } else {
                deferred.resolve(cacheCompanies);
            }

            return deferred.promise;
        },
        getTaxiPoints: function (appId, agencyId) {
            var deferred = $q.defer();
            if (!cacheTaxiPoints.length || cacheTaxiPoints.length === 0) {
                $http.get(Config.getServerURL() + '/getTaxiStation/',
//                $http.get("https://tn.smartcommunitylab.it/smart-planner2/trentino/rest/taxis",
                        Config.getHTTPConfig())
                    .success(function (data) {
                        if (data) {
                            var all = [];
                            cacheTaxiPoints = data;
                            GeoLocate.locate().then(function (pos) {
                                data.forEach(function (p) {
                                    all.push(GeoLocate.distanceTo(p.location));
                                });
                                $q.all(all).then(function (positions) {
                                    data.forEach(function (d, idx) {
                                        d.distance = positions[idx];
                                    });
                                    deferred.resolve(data);
                                });
                            }, function (err) {
                                deferred.resolve(data);
                            });
                            // deferred.resolve(data);

                        } else {
                            deferred.resolve(data);
                        }
                    })
                    .error(function (err) {
                        deferred.reject(err);
                    });
            } else {
                deferred.resolve(cacheTaxiPoints);
            }
            return deferred.promise;
        }

    }
})
