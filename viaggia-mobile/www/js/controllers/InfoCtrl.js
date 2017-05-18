angular.module('viaggia.controllers.info', [])

.controller('InfoCtrl', function ($scope) {})

.controller('ParkingCtrl', function ($scope, $rootScope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, $location, ionicMaterialMotion, ionicMaterialInk, GeoLocate, leafletData, mapService, parkingService, Config, planService, bookmarkService) {
    $scope.agencyId = $stateParams.agencyId;
    $scope.parkings = null;
    $scope.loading = true;
    $scope.markers = [];

    $scope.title = $filter('translate')('menu_real_time_park');
  $scope.direction = null;

  angular.extend($scope, {
    center: {
      lat: Config.getMapPosition().lat,
      lng: Config.getMapPosition().long,
      zoom: Config.getMapPosition().zoom
    },
    markers: [],
    events: {}
  });
    $scope.$on('ngLastRepeat.parkings', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });

  //get all the parkings data with the specified agencyId and set the availability level
    $scope.load = function (selectedId) {
        parkingService.getParkings($scope.agencyId).then(function (data) {
            $scope.parkings = data;
            $scope.parkings.forEach(function (e) {
                if (e.monitored && e.slotsAvailable > -2) {
                    e.availLevel = e.slotsAvailable <= 5 ? 'avail-red' : e.slotsAvailable > 20 ? 'avail-green' : 'avail-yellow';
                }
                if (decodeURI(selectedId) == e.id) {
                    $scope.select(e);
                }

            });
            $scope.loading = false;
      $scope.noConnection = false;
            Config.loaded();
            $scope.$broadcast('scroll.refreshComplete');
            //            if ($scope.selected) {
            //                $scope.showMap(true);
            //            }
        }, function (err) {
            $scope.parkings = null;
            $scope.showNoConnection();
            $scope.loading = true;
            $scope.$broadcast('scroll.refreshComplete');
            Config.loaded();
        });
    }

    var init = function () {
        $scope.loading = true;
        Config.loading();
        $scope.load($stateParams.id);
    };

    $scope.selected = null;
    $scope.select = function (p) {
        //        if ($scope.selected == p) {
        //            $scope.selected = null;
        //        } else {
        $scope.selected = p;
        var path = $location.path();
        if ($state.current.name == 'app.parkingstation') {
            path = path.substr(0, path.lastIndexOf('/'));
        }
        path += '/' + p.id;
        $scope.bookmarkStyle = bookmarkService.getBookmarkStyle(path);
        //        }
        $scope.showMap(true);
    };

    $scope.showMap = function (withPopup) {
        $scope.modalMap.show().then(function () {
            var markers = [];
            var list = ($scope.selected != null && withPopup) ? [$scope.selected] : $scope.parkings;
            if (list == null) list = [];
            var boundsArray = [];
            for (var i = 0; i < list.length; i++) {
                markers.push({
                    parking: list[i],
                    lat: parseFloat(list[i].position[0]),
                    lng: parseFloat(list[i].position[1]),
                    icon: {
                        iconUrl: 'img/ic_parkingLot.png',
                        iconSize: [36, 50],
                        iconAnchor: [18, 50],
                        popupAnchor: [-0, -50]
                    },
                    //                        focus: true
                });
                boundsArray.push(list[i].position);
            }
            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('modalMapParking').then(function (map) {
                    map.fitBounds(bounds);
                });
            }
            $scope.markers = markers;
            if (withPopup) {
                showPopup(list[0]);
            }
        });
    };

    $scope.$on('$ionicView.beforeEnter', function () {
        mapService.refresh('modalMapParking');
    });

    $ionicModal.fromTemplateUrl('templates/mapModalParking.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });


    $scope.closeMap = function () {
        $scope.modalMap.hide();
    };
    $scope.initMap = function () {
        mapService.initMap('modalMapParking').then(function () {
            console.log('map initialized');
        });
    };

    var showPopup = function (p) {
        $scope.popupParking = p;
        $scope.selected = p;

        $ionicPopup.show({
            templateUrl: 'templates/parkingPopup.html',
            title: $filter('translate')('lbl_parking'),
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    onTap: function (e) {
                        planService.setPlanConfigure({
                            to: {
                                name: $scope.popupParking.description,
                                lat: $scope.popupParking.position[0],
                                long: $scope.popupParking.position[1]
                            },
                        });
                        planService.setName('to', $scope.popupParking.description);
                        $scope.closeMap();
                        $state.go('app.plan');
                    }
                }
            ]
        });

    }

    $scope.$on('leafletDirectiveMarker.modalMapParking.click', function (e, args) {
        var p = $scope.markers[args.modelName].parking;
        showPopup(p);
    });

    $scope.navigate = function () {
        planService.setPlanConfigure({
            to: {
                name: $scope.selected.description,
                lat: $scope.selected.position[0],
                long: $scope.selected.position[1]
            },
        });
        planService.setName('to', $scope.selected.description);
        $scope.closeMap();
        $state.go('app.plan');
    };

    init();

    $scope.bookmark = function () {
        var ref = Config.getTTData($stateParams.ref);
        var path = $stateParams.id ? $location.path() : ($location.path() + '/' + $scope.selected.id);
        bookmarkService.toggleBookmark(path, $scope.selected.name, 'PARKING', {
            agencyId: $scope.agencyId,
            parkingId: $scope.selected.id
        }).then(function (style) {
            $scope.bookmarkStyle = style;
        });
    };

})

.controller('ParkingMetersCtrl', function ($scope, $rootScope, $state, $ionicHistory, $q, Config, $ionicModal, $ionicPopup, $filter, $cordovaDeviceOrientation, mapService, parkingService, GeoLocate) {
    $scope.isAndroid = ionic.Platform.isAndroid();
    if (!firstTimeParkingMeterView()) {
      $ionicPopup.show({
        templateUrl: 'templates/firstTimeParkingMeterPopup.html',
        title: $filter('translate')('lbl_parking'),
        cssClass: 'first-time-parking-meters-popup',
        scope: $scope,
        buttons: [
          {
            text: $filter('translate')('btn_close'),
            type: 'button-close',
            onTap: function (e) {
              $ionicHistory.goBack();
            }
                }, {
            text: $filter('translate')('btn_undertood'),
            type: 'button-close',
            onTap: function (e) {
              setFirstTimeParkingMeterView();
              cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
                if (canRequest) {
                  cordova.plugins.locationAccuracy.request(onRequestSuccess, onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY); // iOS will ignore this
                }
              });
            }
                }
                ]
      });
    } else {
      geolocate().then(function () {
        //gps allowed and go on
        console.log('gps allowed');
      }, function () {
        //gps not allowed, then pop up, let it do it or come back
        console.log('gps not allowed');
        $ionicPopup.show({
          templateUrl: 'templates/noGpsPopup.html',
          title: $filter('translate')('lbl_parking'),
          cssClass: 'first-time-parking-meters-popup',
          scope: $scope,
          buttons: [
            {
              text: $filter('translate')('btn_close'),
              type: 'button-close',
              onTap: function (e) {
                $ionicHistory.goBack();
              }
            },
            {
              text: $filter('translate')('btn_undertood'),
              type: 'button-close',
              onTap: function (e) {
                if (! window.cordova) return;
                cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
                  if (canRequest) {
                    cordova.plugins.locationAccuracy.request(onRequestSuccess, onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY); // iOS will ignore this
                  }
                });
              }
              }
         ]
        });
      })
    }
    $scope.initMapParkingMeter = function () {
      mapService.initMap('modalMapParkingMeters').then(function () {
        console.log('map initialized');
      });
    }
    angular.extend($scope, {
      center: {
        lat: Config.getMapPosition().lat,
        lng: Config.getMapPosition().long,
        zoom: Config.getMapPosition().zoom
      },
      markers: [],
      events: {}
    });
    $scope.openCalibrationPopup = function () {
      $ionicPopup.show({
        templateUrl: 'templates/calibrationPopup.html',
        title: $filter('translate')('lbl_calibration'),
        cssClass: 'first-time-parking-meters-popup',
        scope: $scope,
        buttons: [
          {
            text: $filter('translate')('btn_undertood'),
            type: 'button-close'
                }
        ]
      });
    }
    function onRequestSuccess(success) {
      console.log("Successfully requested accuracy: " + success.message);
      if (success.code == cordova.plugins.locationAccuracy.SUCCESS_USER_AGREED) {
        $scope.initParkingMeters();
      } else {
      }
    }
    function onRequestFailure(error) {
      console.error("Accuracy request failed: error code=" + error.code + "; error message=" + error.message);
      if (error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
        //manage error with popup
        $ionicPopup.show({
          templateUrl: 'templates/calibrationPopup.html',
          title: $filter('translate')('lbl_calibration'),
          cssClass: 'first-time-parking-meters-popup',
          scope: $scope,
          buttons: [
            {
              text: $filter('translate')('btn_close'),
              type: 'button-close',
              onTap: function (e) {
                $ionicHistory.goBack();
              }
                },
            {
              text: $filter('translate')('btn_yes'),
              type: 'button-close',
              onTap: function (e) {
                cordova.plugins.diagnostic.switchToLocationSettings();
              }
                }
        ]
        });
      } else {
        //user disagreed so go back
        $ionicHistory.goBack();
      }
    }
    function geolocate() {
      var defer = $q.defer();
      GeoLocate.locate().then(
        function (position) {
          $rootScope.myPosition = position;
          $rootScope.GPSAllow = true;
          defer.resolve();
        },
        function () {
          console.log('Geolocation not possible');
          $rootScope.GPSAllow = false;
          defer.reject();
        }
      );
      return defer.promise;
    };
    function firstTimeParkingMeterView() {
      return localStorage.getItem(Config.getAppId() + "_firstTimeParkingMeterView");
    }
    function setFirstTimeParkingMeterView() {
      localStorage.setItem(Config.getAppId() + "_firstTimeParkingMeterView", true);
    }
    function onSuccess(heading) {
      drawArrow(getDirection(heading.magneticHeading));
      drawDistance(GeoLocate.distance($rootScope.myPosition, [$scope.selectedParkingMeters.lat, $scope.selectedParkingMeters.lng]));
    };
    function onError(compassError) {
      alert('Compass error: ' + compassError.code);
    };
    var options = {
      frequency: 200
    }; // Update every 0.5 seconds
    $scope.initParkingMeters = function () {
      $scope.windowOrientation = window.orientation;
      Config.loading();
      GeoLocate.locate().then(function (position) {
        //get parking meter list based on my position and other parameters in configuration service
        parkingService.getParkingMeters(position[0], position[1]).then(function (parkingMetersZones) {
          //init the comapss service with callbacks
          var markers = [];
          var boundsArray = [];
          for (var i = 0; i < parkingMetersZones.length; i++) {
            if (parkingMetersZones[i].parkingMeters) {
              for (var k = 0; k < parkingMetersZones[i].parkingMeters.length; k++) {
                var parkingMeter = parkingMetersZones[i].parkingMeters[k];
                parkingMeter.validityPeriod = parkingMetersZones[i].validityPeriod;
                markers.push({
                  parking: parkingMeter,
                  index: k + i,
                  lat: parseFloat(parkingMetersZones[i].parkingMeters[k].lat),
                  lng: parseFloat(parkingMetersZones[i].parkingMeters[k].lng),
                  icon: {
                    iconUrl: 'img/ic_parcometro.png',
                    iconSize: [36, 50],
                    iconAnchor: [18, 50],
                    popupAnchor: [-0, -50]
                  },
                });
                boundsArray.push([parkingMetersZones[i].parkingMeters[k].lat, parkingMetersZones[i].parkingMeters[k].lng]);
              }
            }
          }
          $scope.markers = markers;
          selectNearest(markers);
          GeoLocate.initCompassMonitor(onSuccess, onError, options);
          //manage visualization
          if (boundsArray.length > 0) {
            boundsArray.push([$rootScope.myPosition[0], $rootScope.myPosition[1]]);
            var bounds = L.latLngBounds(boundsArray);
            mapService.getMap('modalMapParkingMeters').then(function (map) {
              map.fitBounds(bounds, {
                padding: [50, 50]
              });
            });
          }
          Config.loaded();
        }, function (err) {
          $scope.showNoConnection();
          Config.loaded();
        })
      }, function (err) {
        Config.loaded();
      });
    }
    $scope.getValidityPeriodDays = function (weekDays) {
      var returnString = "";
      var days = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
      for (var k = 0; k < days.length; k++) {
        if (weekDays.indexOf(days[k]) > -1) {
          returnString += $filter('translate')('weekdays_' + days[k] + '_period') + ', ';
        }
      }
      return returnString.slice(0, -2);;
    }
    $scope.initParkingMeters();
    $scope.$on("$destroy", function (event) {
      mapService.stopPosTimer('modalMapParkingMeters');
      GeoLocate.closeCompassMonitor();
    });
    window.addEventListener("orientationchange", function () {
      console.log(screen.orientation);
      console.log(window.orientation);
      $scope.windowOrientation = window.orientation;
      //modify the rotation of the compass with screen.orientation
      $scope.initParkingMeters();
    });
    var showPopupParkingMeters = function (p, index) {
      $scope.popupParkingMeter = p;
      $scope.selected = p;
      $ionicPopup.show({
        templateUrl: 'templates/parkingMeterPopup.html',
        title: $filter('translate')('lbl_parking'),
        cssClass: 'parking-meter-popup',
        scope: $scope,
        buttons: [
          {
            text: $filter('translate')('btn_close'),
            type: 'button-close'
                },
          {
            text: $filter('translate')('btn_drive_me'),
            onTap: function (e) {
              driveMeParcometer(p, index);
            }
        }]
      });
    }
    $scope.$on('leafletDirectiveMarker.modalMapParkingMeters.click', function (e, args) {
      var p = $scope.markers[args.modelName].parking;
      var index = $scope.markers[args.modelName].index;
      showPopupParkingMeters(p, index);
    });
    function selectNearest(arrayOfPoints) {
      var minDistance = 9999999;
      for (var i = 0; i < arrayOfPoints.length; i++) {
        var distance = GeoLocate.distance($rootScope.myPosition, [arrayOfPoints[i].lat, arrayOfPoints[i].lng]);
        if (distance < minDistance) {
          minDistance = distance;
          $scope.selectedParkingMeters = arrayOfPoints[i];
          $scope.selectedParkingMetersIndex = i;
        }
      }
      $scope.markers[$scope.selectedParkingMetersIndex].icon = {
        iconUrl: "img/ic_parcometro_selected.png",
        iconSize: [36, 50],
        iconAnchor: [18, 50],
        popupAnchor: [-0, -50]
      }
    }
    function driveMeParcometer(p, index) {
      $scope.markers[$scope.selectedParkingMetersIndex].icon = {
        iconUrl: "img/ic_parcometro.png",
        iconSize: [36, 50],
        iconAnchor: [18, 50],
        popupAnchor: [-0, -50]
      }
      $scope.selectedParkingMetersIndex = index;
      $scope.selectedParkingMeters = p;
      //update icon for that
      $scope.markers[$scope.selectedParkingMetersIndex].icon = {
          iconUrl: "img/ic_parcometro_selected.png",
          iconSize: [36, 50],
          iconAnchor: [18, 50],
          popupAnchor: [-0, -50]
        }
    }
    function getDirection(magneticHeading) {
      var bearing = GeoLocate.bearing($rootScope.myPosition, [$scope.selectedParkingMeters.lat, $scope.selectedParkingMeters.lng]);
      var rotated_bearing = (bearing + 360) % 360;
      return (rotated_bearing - magneticHeading) % 360;
    };
    function drawArrow(r) {
      var div = document.getElementById('arrow');
      if (div) {
        div.style.webkitTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
        div.style.mozTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
        div.style.msTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
        div.style.oTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
        div.style.transform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
      }
    }
    function degreesToRadians(degrees) {
      console.log(degrees * (Math.PI / 180));
      return degrees * (Math.PI / 180);
    }
    function radianToDegrees(radians) {
      console.log(radians * (Math.PI / 180));
      return radians * 180 / Math.PI;
    }
    function drawDistance(distance) {
      $scope.distanceFromParkingMeter = Math.round(distance * 1000) + ' m';
    }
    $scope.getPrice = function (price) {
      return (price / 100).toFixed(2) + " €/ora."
    }
  })
  /*

  Controller that manages the bike stops: list of the stops with availability, visualization the stops on the map (modals)

  */

.controller('BikeSharingCtrl', function ($scope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, $location, ionicMaterialMotion, ionicMaterialInk, leafletData, mapService, bikeSharingService, Config, planService, bookmarkService) {
    $scope.agencyId = $stateParams.agencyId;
    $scope.parkings = null;

    $scope.markers = [];

    $scope.title = $filter('translate')('menu_real_time_bike');
    $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($scope.selected);

    $scope.$on('ngLastRepeat.parkings', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });

  //get all the bike stops data with the specified agencyId and set the availability level

    $scope.load = function (selectedId) {
        bikeSharingService.getStations($scope.agencyId).then(function (data) {
            $scope.parkings = data;
            $scope.parkings.forEach(function (e) {
                if (decodeURI(selectedId) == e.id) {
                    $scope.select(e);
                }

            });
            $scope.loading = false;
            Config.loaded();
      $scope.noConnection = false;
            $scope.$broadcast('scroll.refreshComplete');
            //            if ($scope.selected) {
            //                $scope.showMap(true);
            //            }
        }, function (err) {
            $scope.parkings = null;
            $scope.$broadcast('scroll.refreshComplete');
      $scope.noConnection = true;
            $scope.showNoConnection();
            $scope.loading = true;
            Config.loaded();
        });
    }

    var init = function () {
        $scope.loading = true;
        Config.loading();
        $scope.load($stateParams.id);
    };

    $scope.selected = null;
    $scope.select = function (p, path) {
        //        if ($scope.selected == p) {
        //          $scope.selected = null;
        //        } else {
        $scope.selected = p;
        var path = $location.path();
        if ($state.current.name == 'app.bikestation') {
            path = path.substr(0, path.lastIndexOf('/'));
        }
        path += '/' + p.id;
        $scope.bookmarkStyle = bookmarkService.getBookmarkStyle(path);
        //        }
        $scope.showMap(true);
    };

    $scope.showMap = function (withPopup) {
        $scope.modalMap.show().then(function () {
            var markers = [];

            var list = ($scope.selected != null && withPopup) ? [$scope.selected] : $scope.parkings;
            if (list == null) list = [];
            var boundsArray = [];
            for (var i = 0; i < list.length; i++) {
                markers.push({
                    parking: list[i],
                    lat: parseFloat(list[i].position[0]),
                    lng: parseFloat(list[i].position[1]),
                    icon: {
                        iconUrl: 'img/ic_bike.png',
                        iconSize: [36, 50],
                        iconAnchor: [18, 50],
                        popupAnchor: [-0, -50]
                    },
                    //                        focus: true
                });
                boundsArray.push(list[i].position);
            }
            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('modalMapBike').then(function (map) {
                    map.fitBounds(bounds);
                });
            }
            $scope.markers = markers;
            if (withPopup) {
                showPopup(list[0]);
            }
        });
    };

    $ionicModal.fromTemplateUrl('templates/mapModalBike.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    angular.extend($scope, {
        center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
        },
        markers: [],
        events: {}
    });

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    };
    $scope.initMap = function () {
        mapService.initMap('modalMapBike').then(function () {});
    };

    var showPopup = function (p) {
        $scope.popupParking = p;
        $scope.selected = p;

        $ionicPopup.show({
            templateUrl: 'templates/bikesharingPopup.html',
            title: $filter('translate')('lbl_bike_station'),
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    type: 'button-close',
                    onTap: function (e) {
                        planService.setPlanConfigure({
                            to: {
                                name: $scope.popupParking.address,
                                lat: $scope.popupParking.position[0],
                                long: $scope.popupParking.position[1]
                            },
                        });
                        planService.setName('to', $scope.popupParking.address);
                        $scope.closeMap();
                        $state.go('app.plan');
                    }
                }
            ]
        });

    }

    $scope.$on('leafletDirectiveMarker.modalMapBike.click', function (e, args) {
        var p = $scope.markers[args.modelName].parking;
        showPopup(p);
    });

    $scope.$on('$ionicView.beforeEnter', function () {
        mapService.refresh('modalMapBike');
    });

    $scope.navigate = function () {
        planService.setPlanConfigure({
            to: {
                name: $scope.selected.address,
                lat: $scope.selected.position[0],
                long: $scope.selected.position[1]
            },
        });
        planService.setName('to', $scope.selected.address);
        $scope.closeMap();
        $state.go('app.plan');
    };

    $scope.bookmark = function () {
        var ref = Config.getTTData($stateParams.ref);
        var path = $stateParams.id ? $location.path() : ($location.path() + '/' + $scope.selected.id);
        bookmarkService.toggleBookmark(path, $scope.selected.name, 'BIKESHARING', {
            agencyId: $scope.agencyId,
            parkingId: $scope.selected.id
        }).then(function (style) {
            $scope.bookmarkStyle = style;
        });
    };

    init();
})
