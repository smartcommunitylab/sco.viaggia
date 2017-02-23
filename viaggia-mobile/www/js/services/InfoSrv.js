angular.module('viaggia.services.info', [])

/**
 * A SERVICE TO WORK WITH PARKING DATA FROM SERVER
 */
.factory('parkingService', function ($http, $q, $filter, Config, DataManager, GeoLocate) {
  var cache = {};

  var generateId = function (name) {
    return name ? name.replace('/', '_') : '_';
  };

  var getFromCache = function (agencyId, parkingId, deferred) {
    for (var i = 0; i < cache[agencyId].length; i++) {
      if (cache[agencyId][i].id == parkingId) {
        deferred.resolve(cache[agencyId][i]);
        return;
      }
    }
    deferred.resolve(null);
  }

  return {
    getParking: function (agencyId, parkingId) {
      var deferred = $q.defer();
      if (cache[agencyId]) {
        getFromCache(agencyId, parkingId, deferred);
      } else {
        this.getParkings(agencyId).then(
          function () {
            if (cache[agencyId]) {
              getFromCache(agencyId, parkingId, deferred);
            } else {
              deferred.resolve(null);
            }
          },
          function () {
            deferred.resolve(null);
          }
        );
      }
      return deferred.promise;
    },
    getParkings: function (agencyId) {
      var deferred = $q.defer();
      $http.get(Config.getServerURL() + '/getparkingsbyagency/' + agencyId,
          Config.getHTTPConfig())
        .success(function (data) {
          if (data) {
            data.forEach(function (d, idx) {
              d.id = generateId(d.name);
            });
            var all = [];
            cache[agencyId] = data;
            GeoLocate.locate().then(function (pos) {
              data.forEach(function (p) {
                all.push(GeoLocate.distanceTo(p.position));
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


      return deferred.promise;
    },
    getParkingMeters: function (lat, long) {
      var deferred = $q.defer();


      $http.get(Config.getMetroparcoServerURL() + '/nearparkingmeters/' + lat + '/' + long + '/' + Config.getParkingMetersRadius() + '/' + Config.getParkingMetersMaxNumber() + "?agencyIds=" + Config.getParkingMetersAgencyIds().join(", "),
          Config.getHTTPConfig())
        .success(function (data) {
          deferred.resolve(data);
        })
        .error(function (err) {
          deferred.reject(err);
        });


      return deferred.promise;
    }
  }
})

.factory('bikeSharingService', function ($http, $q, $filter, Config, DataManager, GeoLocate) {
  var cache = {};

  var getFromCache = function (agencyId, parkingId, deferred) {
    for (var i = 0; i < cache[agencyId].length; i++) {
      if (cache[agencyId][i].id == parkingId) {
        deferred.resolve(cache[agencyId][i]);
        return;
      }
    }
    deferred.resolve(null);
  }

  return {
    getStation: function (agencyId, parkingId) {
      var deferred = $q.defer();
      if (cache[agencyId]) {
        getFromCache(agencyId, parkingId, deferred);
      } else {
        this.getStations(agencyId).then(
          function () {
            if (cache[agencyId]) {
              getFromCache(agencyId, parkingId, deferred);
            } else {
              deferred.resolve(null);
            }
          },
          function () {
            deferred.resolve(null);
          }
        );
      }
      return deferred.promise;
    },
    getStations: function (agencyId) {
      var deferred = $q.defer();
      $http.get(Config.getServerURL() + '/bikesharing/' + agencyId,
          Config.getHTTPConfig())
        .success(function (data) {
          if (data) {
            var all = [];
            cache[agencyId] = data;
            GeoLocate.locate().then(function (pos) {
              data.forEach(function (p) {
                all.push(GeoLocate.distanceTo(p.position));
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


      return deferred.promise;
    }
  }
})
