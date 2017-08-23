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
          var parkids = Config.getParkingAgencyIds();

          this.getParkings(parkids).then(
            function () {
              if (cache[agencyId]) {
                getFromCache(agencyId, parkingId, deferred);
              } else {
                deferred.resolve(null);
              }
            },
            function () { deferred.resolve(null); }
          );
        }
        return deferred.promise;
      },
      getParkings: function (agencyIds) {
        var deferred = $q.defer();
        var promises = [];
        var responses = -1;
        function lastTask(results) {
          responses++;
          // console.log(results);
          // defer.resolve();
          var parkings = [];
          for (var i = 0; i < results.length; i++) {
            parkings = parkings.concat(results[i].data);
            cache[agencyIds[i]] = results[i].data;
          }
          if (parkings) {
            parkings.forEach(function (d, idx) {
              d.id = generateId(d.name);
            });

            var all = [];
            GeoLocate.locate().then(function (pos) {
              parkings.forEach(function (p) {
                all.push(GeoLocate.distanceTo(p.position));
              });
              $q.all(all).then(function (positions) {
                parkings.forEach(function (d, idx) {
                  d.distance = positions[idx];
                  d.agencyId = agencyIds[responses];
                });
                deferred.resolve(parkings);
              });
            }, function (err) {
              deferred.resolve(parkings);
            });
          } else {
            deferred.resolve(parkings);
          }
        };
function onErrorCallBack() {
          responses++;
          deferred.reject()
        }

        angular.forEach(agencyIds, function (value) {
          promises.push($http.get(Config.getServerURL() + '/getparkingsbyagency/' + value, Config.getHTTPConfig()));
        });
        $q.all(promises).then(lastTask,onErrorCallBack);
        return deferred.promise;
      },
      getParkingMeters: function (lat, long,number) {
        var deferred = $q.defer();


        $http.get(Config.getMetroparcoServerURL() + '/nearparkingmeters/' + lat + '/' + long + '/' + Config.getParkingMetersRadius() + '/' + number + "?agencyIds=" + Config.getParkingMetersAgencyIds().join(", "),
          Config.getHTTPConfig())
          .success(function (data) {
            if (data instanceof Array) {
              deferred.resolve(data);
            } else {
              deferred.reject(data);
            }
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
          var bikeids = Config.getBikeSharingAgencyIds();

          this.getStations(bikeids).then(
            function () {
              if (cache[agencyId]) {
                getFromCache(agencyId, parkingId, deferred);
              } else {
                deferred.resolve(null);
              }
            },
            function () { deferred.resolve(null); }
          );
        }
        return deferred.promise;
      },
      getStations: function (agencyIds) {
        var deferred = $q.defer();
        var promises = [];
         var responses = -1
        function lastTask(results) {
          responses++;
          var bikeStops = [];
          for (var i = 0; i < results.length; i++) {
            bikeStops = bikeStops.concat(results[i].data);
            cache[agencyIds[i]] = results[i].data;
          }
          if (bikeStops) {

            var all = [];
            GeoLocate.locate().then(function (pos) {
              bikeStops.forEach(function (p) {
                all.push(GeoLocate.distanceTo(p.position));
              });
              $q.all(all).then(function (positions) {
                bikeStops.forEach(function (d, idx) {
                  d.distance = positions[idx];
                  d.agencyId=agencyIds[responses];
                });
                deferred.resolve(bikeStops);
              });
            }, function (err) {
              deferred.resolve(bikeStops);
            });
          } else {
            deferred.resolve(bikeStops);
          }
        };

        function onErrorCallBack() {
          responses++;
          deferred.reject()
        }
        angular.forEach(agencyIds, function (value) {
          promises.push($http.get(Config.getServerURL() + '/bikesharing/' + value, Config.getHTTPConfig()));
        });
        $q.all(promises).then(lastTask,onErrorCallBack);
        return deferred.promise;
      }
    }
  })

