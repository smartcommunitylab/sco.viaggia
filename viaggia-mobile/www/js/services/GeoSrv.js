angular.module('viaggia.services.geo', [])
  /*
  Service that manages the user's localization and some usefull geo methods
  */
  .factory('GeoLocate', function ($q, $rootScope, $cordovaDeviceOrientation) {
    var localization = undefined;
    var compassWatch = null;
    if (typeof (Number.prototype.toRad) === "undefined") {
      Number.prototype.toRad = function () {
        return this * Math.PI / 180;
      }
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
              maximumAge: (1 * 60 * 1000), //5 mins
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
            maximumAge: (1 * 60 * 1000), //5 mins
            timeout: 10 * 1000, //1 minute
            enableHighAccuracy: false
          });
        }
      }
      return localization.promise;
    };
    return {
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
      //      calculate bearing between two points
      bearing: function (pt1, pt2) {
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
          //          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          //            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
          //          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          //          d = R * c;
          var y = Math.sin(dLon) * Math.cos(lat2);
          var x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
          var brng = Math.atan2(y, x) * (180 / Math.PI)
        } else {
          console.log('cannot calculate distance!');
        }
        return brng;
      },
      //      calculate distance between two points
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

      //      calculate distance between user and a point
      distanceTo: function (gotoPosition) {
        var GL = this;
        return localization.promise.then(function (myPosition) {
          return GL.distance(myPosition, gotoPosition);
        });
      },

      initCompassMonitor: function (onSuccess, onError, options) {
        //        function onSuccess(heading) {
        //          console.log('Heading: ' + heading.magneticHeading);
        //        };
        //
        //        function onError(compassError) {
        //          alert('Compass error: ' + compassError.code);
        //        };
        //
        //        var options = {
        //          frequency: 500
        //        }; // Update every 3 seconds

        compassWatch = navigator.compass.watchHeading(onSuccess, onError, options);

      },
      closeCompassMonitor: function () {
        if (!window.$cordovaDeviceOrientation) return;
        $cordovaDeviceOrientation.clearWatch(compassWatch);
      }


    };
  })
