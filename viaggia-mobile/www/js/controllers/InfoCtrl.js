angular.module('viaggia.controllers.info', [])

/*

Controller that manages the parkings: list of the stops with availability, visualization the stops on the map (modals)

*/

.controller('ParkingCtrl', function ($scope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, $location, ionicMaterialMotion, ionicMaterialInk, leafletData, mapService, parkingService, Config, planService, bookmarkService) {
  $scope.agencyId = $stateParams.agencyId;
  $scope.parkings = null;
  $scope.loading = true;
  $scope.markers = [];

  $scope.title = $filter('translate')('menu_real_time_park');

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
      Config.loaded();
      $scope.$broadcast('scroll.refreshComplete');
    }, function (err) {
      $scope.parkings = null;
      $scope.showNoConnection();
      $scope.loading = true;
      $scope.$broadcast('scroll.refreshComplete');
      Config.loaded();
    });
  }

  //start to looad the parkings data
  var init = function () {
    $scope.loading = true;
    Config.loading();
    $scope.load($stateParams.id);
  };


  //select a parking lot, set the style of bookmark icon and open the map
  $scope.selected = null;
  $scope.select = function (p) {
    $scope.selected = p;
    var path = $location.path();
    if ($state.current.name == 'app.parkingstation') {
      path = path.substr(0, path.lastIndexOf('/'));
    }
    path += '/' + p.id;
    $scope.bookmarkStyle = bookmarkService.getBookmarkStyle(path);
    $scope.showMap(true);
  };

  //open the modal map with all the markers of the parkings. If withPopup is true, open it with the details of selected parking
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

  //refresh the map and avoid the grey tiles on it
  $scope.$on('$ionicView.beforeEnter', function () {
    mapService.refresh('modalMapParking');
  });

  //create the modal with the map
  $ionicModal.fromTemplateUrl('templates/mapModalParking.html', {
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

  //open popup with the detail if one of the marker is clicked
  $scope.$on('leafletDirectiveMarker.modalMapParking.click', function (e, args) {
    var p = $scope.markers[args.modelName].parking;
    showPopup(p);
  });


  //plan the journey to the selected parking
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

  //add/remove the parking from the list of bookmarks
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
      $scope.$broadcast('scroll.refreshComplete');
    }, function (err) {
      $scope.parkings = null;
      $scope.$broadcast('scroll.refreshComplete');
      $scope.showNoConnection();
      $scope.loading = true;
      Config.loaded();
    });
  }

  //start to load the bike stops data
  var init = function () {
    $scope.loading = true;
    Config.loading();
    $scope.load($stateParams.id);
  };

  //select a bike stop, set the style of bookmark icon and open the map
  $scope.selected = null;
  $scope.select = function (p, path) {
    $scope.selected = p;
    var path = $location.path();
    if ($state.current.name == 'app.bikestation') {
      path = path.substr(0, path.lastIndexOf('/'));
    }
    path += '/' + p.id;
    $scope.bookmarkStyle = bookmarkService.getBookmarkStyle(path);
    $scope.showMap(true);
  };

  //open the modal map with all the markers of the bike stops. If withPopup is true, open it with the details of selected stop
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

  //create the modal with the map
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

  //refresh the map and avoid the grey tiles on it
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

  //add/remove the bike stop from the list of bookmarks
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
