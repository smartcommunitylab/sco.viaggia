angular.module('viaggia.services.geo', [])

.factory('GeoLocate', function ($q, $rootScope) {
    var localization = undefined;

    if (typeof (Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function () {
            return this * Math.PI / 180;
        }
    }

    function compute(v1, a1, v2, a2, d) {
      if ((a1 + a2)/1000 > d) {
        var v = a1 > a2 ? (v2 - (v2-v1)*a2/a1) : (v1+ (v2-v1)*a1/a2);
        return [v,v];
      }
      return [v1 + (v2-v1)*a1/d/1000, v2 - (v2-v1)*a2/d/1000];
    }

    function computeLats(p1, p2, d) {
      if (p1.coords.latitude > p2.coords.latitude) {
        var res = computeLats(p2, p1, d);
        return [res[1],res[0]];
      }
      return compute(p1.coords.latitude, p1.coords.accuracy, p2.coords.latitude, p2.coords.accuracy, d);
    }
    function computeLngs(p1, p2, d) {
      if (p1.coords.longitude > p2.coords.longitude) {
        var res = computeLngs(p2, p1, d);
        return [res[1],res[0]];
      }
      return compute(p1.coords.longitude, p1.coords.accuracy, p2.coords.longitude, p2.coords.accuracy, d);
    }

    function transformPair(p1, p2, res, distFunc) {
      var d = distFunc(p1,p2);
      if (d == 0) return;

      var lats = computeLats(p1,p2,d);
      var lngs = computeLngs(p1,p2,d);
      res.push({lat: lats[0], lng: lngs[0]});
      res.push({lat: lats[1], lng: lngs[1]});
    }

    var myPosition = null;

    var initLocalization = function () {
        if (typeof localization == 'undefined') {
            localization = $q.defer();
            if (ionic.Platform.isWebView()) {
                //console.log('geolocalization initing (cordova)...');
                document.addEventListener("deviceready", function () {
                    //console.log('geolocalization inited (cordova)');
                    $rootScope.locationWatchID = navigator.geolocation.watchPosition(function (position) {
                        r = [position.coords.latitude, position.coords.longitude];
                        $rootScope.myPosition = r;
                        $rootScope.myPositionAccuracy = position.coords.accuracy;
                        //console.log('geolocated (cordova)');
                        localization.resolve(r);
                    }, function (error) {
                        console.log('cannot geolocate (cordova)');
                        localization.reject('cannot geolocate (web)');
                    }, {
                        //frequency: (20 * 60 * 1000), //20 mins
                        maximumAge: (10 * 60 * 1000), //10 mins
                        timeout: 10 * 1000, //1 minute
                        enableHighAccuracy: (device.version.indexOf('2.') == 0) // true for Android 2.x
                    });
                }, false);
            } else {
                //console.log('geolocalization inited (web)');
                $rootScope.locationWatchID = navigator.geolocation.watchPosition(function (position) {
                    r = [position.coords.latitude, position.coords.longitude];
                    $rootScope.myPosition = r;
                    $rootScope.myPositionAccuracy = position.coords.accuracy;
                    //console.log('geolocated (web)');
                    localization.resolve(r);
                }, function (error) {
                    console.log('cannot geolocate (web)');
                    localization.reject('cannot geolocate (web)');
                }, {
                    maximumAge: (10 * 60 * 1000), //5 mins
                    timeout: 10 * 1000, //1 minute
                    enableHighAccuracy: false
                });
            }
        }
        return localization.promise;
    };
    var geo = {
        reset: function () {
            localization = undefined;
        },
        locate: function () {
            //console.log('geolocalizing...');
            return initLocalization(localization).then(function (firstGeoLocation) {
                return $rootScope.myPosition;
            });
        },
        getAccuracy: function () {
            return $rootScope.myPositionAccuracy;
        },
        distance: function (pt1, pt2) {
            var d = false;
            if (pt1 && pt1[0] && pt1[1] && pt2 && pt2[0] && pt2[1]) {
                var lat1 = Number(pt1[0]);
                var lon1 = Number(pt1[1]);
                var lat2 = Number(pt2[0]);
                var lon2 = Number(pt2[1]);

                var R = 6371; // km
                //var R = 3958.76; // miles
                var dLat = (lat2 - lat1).toRad();
                var dLon = (lon2 - lon1).toRad();
                var lat1 = lat1.toRad();
                var lat2 = lat2.toRad();
                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                d = R * c;
            } else {
                console.log('cannot calculate distance!');
            }
            return d;
        },
        distanceTo: function (gotoPosition) {
            var GL = this;
            return localization.promise.then(function (myPosition) {
                //console.log('myPosition: ' + JSON.stringify(myPosition));
                //console.log('gotoPosition: ' + JSON.stringify(gotoPosition));
                return GL.distance(myPosition, gotoPosition);
            });
        },
        /**
         * Input: array of objects of type {coords:{latitude:..., longitude:..., accuracy:...}}
         * Output: array of object of type {lat:..., lng:...}
         */
        transform: function(array) {
          var res = [];

          var distFunc = function(p1, p2) {
            return geo.distance([p1.coords.latitude, p1.coords.longitude],[p2.coords.latitude, p2.coords.longitude]);
          }

          for (var i = 1; i < array.length; i++) {
            transformPair(array[i-1], array[i], res, distFunc);
          }
          return res;
        }
    };

    return geo;
})
