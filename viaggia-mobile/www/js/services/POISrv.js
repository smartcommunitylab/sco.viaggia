angular.module('viaggia.services.pois', [])

/**
 * A SERVICE TO WORK WITH PARKING DATA FROM SERVER
 */
.factory('poiService', function ($http, $q, $filter, Config) {
  var svc = {};
  var objects = null;

  
  svc.getPOIs = function(){
    var deferred = $q.defer();

    if (objects != null) {
      deferred.resolve(objects);
      return deferred.promise;
    }
    
    $http.get(Config.getPOIURL()).then(function(data){
      if (!data.data.features) {
        objects = [];
        deferred.resolve([]);
      } else {
        objects = data.data.features;
        deferred.resolve(objects);
      }
    }, function(err) {
      deferred.reject(err);
    });
    
    return deferred.promise;
  }
  
  svc.getPOI = function(id) {
    var deferred = $q.defer();
    if (objects != null) {
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].properties.id == id) {
          deferred.resolve(objects[i]);
          return deferred.promise;
        }
      }
      deferred.resolve(null);
    } else {
      svc.getPOIs().then(function(){
        svc.getPOI(id).then(function(obj){
          deferred.resolve(obj);
        });
      },function(err) {
        deferred.reject(err);
      });
    }
    return deferred.promise;
  }
  
  return svc;
})
