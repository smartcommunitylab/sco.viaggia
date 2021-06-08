angular.module('viaggia.services.events', [])

/**
 * A SERVICE TO WORK WITH PARKING DATA FROM SERVER
 */
.factory('eventService', function ($http, $q, $filter, Config, GeoLocate) {
  var svc = {};
  var objects = null;

  
  svc.getEVENTs = function(){
    var deferred = $q.defer();

    if (objects != null) {
      deferred.resolve(objects);
      return deferred.promise;
    }
    
    $http.get(Config.getEVENTURL()).then(function(data){
      // fix malformed geojson format
      // begin
      if (data.data.geodata) {
        data.data.features = data.data.geodata.features;
      }
      // fix malformed geojson format
      // end

      if (!data.data.features) {
        objects = [];
        deferred.resolve([]);
      } else {
        objects = data.data.features;
        objects.forEach(function(o){
          // fix malformed coodinates array when it contains strings
          // begin
          tmp = o.geometry.coordinates.match(/\d+(?:\.\d+)?/g).map(Number)
          o.geometry.coordinates = tmp;
          // fix malformed coodinates array when it contains strings
          // end
          o.geometry.coordinates.reverse();
          if (!o.properties.image) {
            o.properties.image = 'img/event_default.jpg';
          }
        });
        var all = [];
        GeoLocate.locate().then(function (pos) {
          objects.forEach(function (p) {
            all.push(GeoLocate.distanceTo(p.geometry.coordinates));
          });
          $q.all(all).then(function (positions) {
            objects.forEach(function (d, idx) {
              d.distance = positions[idx];
            });
            deferred.resolve(objects);
          });
        }, function (err) {
          deferred.resolve(objects);
        });
      }
    }, function(err) {
      deferred.reject(err);
    });
    
    return deferred.promise;
  }
  
  svc.getEVENT = function(id) {
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
      svc.getEVENTs().then(function(){
        svc.getEVENT(id).then(function(obj){
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
