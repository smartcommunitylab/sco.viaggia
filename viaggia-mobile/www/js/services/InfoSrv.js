angular.module('viaggia.services.info', [])

/**
 * A SERVICE TO WORK WITH PARKING DATA FROM SERVER
 */
.factory('parkingService', function ($http, $q, $filter, Config, DataManager, GeoLocate) {
  return {
    getParkings : function(agencyId) {
      var deferred = $q.defer();
      $http.get(Config.getServerURL()+'/getparkingsbyagency/'+agencyId,
                Config.getHTTPConfig())
        .success(function(data) {
          if (data) {
            var all = [];
            data.forEach(function(p) {
              all.push(GeoLocate.distanceTo(p.position));
            });
            $q.all(all).then(function(positions){
              data.forEach(function(d, idx) {
                d.distance = positions[idx];
              });
              deferred.resolve(data);
            });
          } else {
            deferred.resolve(data);
          }
        })
        .error(function(err) {
          deferred.reject(err);
        });


      return deferred.promise;
    }
  }
})

.factory('bikeSharingService', function ($http, $q, $filter, Config, DataManager, GeoLocate) {
  return {
    getStations : function(agencyId) {
      var deferred = $q.defer();
      $http.get(Config.getServerURL()+'/bikesharing/'+agencyId,
                Config.getHTTPConfig())
        .success(function(data) {
          if (data) {
            var all = [];
            data.forEach(function(p) {
              all.push(GeoLocate.distanceTo(p.position));
            });
            $q.all(all).then(function(positions){
              data.forEach(function(d, idx) {
                d.distance = positions[idx];
              });
              deferred.resolve(data);
            });
          } else {
            deferred.resolve(data);
          }
        })
        .error(function(err) {
          deferred.reject(err);
        });


      return deferred.promise;
    }
  }
})
