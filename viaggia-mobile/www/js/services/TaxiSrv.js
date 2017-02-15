angular.module('viaggia.services.taxi', [])

/**
 * A SERVICE TO WORK WITH TAXI DATA FROM SERVER
 */
.factory('taxiService', function ($http, $q, $filter, Config, GeoLocate) {
  var cacheCompanies = {};
  var cacheTaxiPoints = {};
  return {
    getCompanies: function (appId, agencyId) {
      var deferred = $q.defer();
      if (!cacheCompanies.length || cacheCompanies.length === 0) {
        $http.get(Config.getServerURL() + '/getTaxiAgencyContacts/',
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
