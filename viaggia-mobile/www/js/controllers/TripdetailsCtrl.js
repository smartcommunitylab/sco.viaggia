angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $stateParams, $ionicModal, $filter, $ionicPopup, planService, mapService, Config, Toast, $filter, $ionicHistory, $state, $location, bookmarkService) {
    $scope.title = $filter('translate')('journey_detail');

    var initMyTrip = function() {
      planService.setEditInstance(null);
      $scope.editMode = false;
      planService.getTrip($stateParams.tripId).then(function(trip){
        $scope.tripId = $stateParams.tripId;
        $scope.tripName = trip.data.name;
        $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($location.path());
        $scope.requestedFrom = trip.data.originalFrom.name;
        $scope.requestedTo = trip.data.originalTo.name;

        planService.setPlanConfigure(trip.data.originalRequest);
        planService.process(trip.data.data, $scope.requestedFrom, $scope.requestedTo);
        $scope.currentItinerary = trip.data.data;
        $scope.pathLine = mapService.getTripPolyline(trip.data.data);
        $scope.pathMarkers = mapService.getTripPoints(trip.data.data);

        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            markers: $scope.pathMarkers,
            events: {},
            pathLine: $scope.pathLine
        });
      });
    }

    var initNewTrip = function() {
      var trip = planService.getSelectedJourney();
      $scope.trip = trip;
      $scope.editMode = true;

      $scope.requestedFrom = planService.getName("from");
      if (!$scope.requestedFrom) {
          $scope.requestedFrom = trip.from.name;
      }
      $scope.requestedTo = planService.getName("to");
      if (!$scope.requestedTo) {
          $scope.requestedTo = trip.to.name;
      }
      var editInstance = planService.getEditInstance();
      $scope.tripId = editInstance ? editInstance.tripId : null;
      planService.process(trip, $scope.requestedFrom, $scope.requestedTo);
      $scope.currentItinerary = trip;
      $scope.pathLine = mapService.getTripPolyline(trip);
      $scope.pathMarkers = mapService.getTripPoints(trip);
      angular.extend($scope, {
          center: {
              lat: Config.getMapPosition().lat,
              lng: Config.getMapPosition().long,
              zoom: Config.getMapPosition().zoom
          },
          markers: $scope.pathMarkers,
          events: {},
          pathLine: $scope.pathLine
      });
    }

    if ($stateParams.tripId) {
      initMyTrip();
    } else {
      initNewTrip();
    }

    $scope.toTime = function (millis) {
        return planService.getTimeStr(new Date(millis));
    };
    $ionicModal.fromTemplateUrl('templates/planMapModal.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });
    $scope.openMapTrip = function () {
        $scope.modalMap.show().then(function () {
            var boundsArray = [];
            for (var i = 0; i < $scope.pathMarkers.length; i++) {
                var bound = [$scope.pathMarkers[i].lat, $scope.pathMarkers[i].lng];
                boundsArray.push(bound);
            }
            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('planMapModal').then(function (map) {
                    map.fitBounds(bounds);
                });
            }
        });

    }

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    }
    $scope.saveTrip = function () {
        var editInstance = planService.getEditInstance();
        if ($scope.tripId && editInstance) {
          planService.saveTrip($scope.tripId, $scope.trip, editInstance.data.name, $scope.requestedFrom, $scope.requestedTo).then(function (res) {
              planService.setEditInstance(null);
              $scope.editMode = false;
              $scope.tripId = res.tripId;
              //toast saved
              Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
              $ionicHistory.nextViewOptions({
                  historyRoot: true,
                  disableBack: true
              });
              $state.go('app.mytrips');
          });
          return;
        }
        $scope.data = {};
        $scope.showError = false;
        // Prompt popup code
        $ionicPopup.prompt({
            title: $filter('translate')('save_trip_title'),
            templateUrl: 'templates/popup-savetrip.html',
            subTitle: $filter('translate')('save_trip_text'),
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('save_trip_close_button'),
                    type: 'button-cancel'
                },
                {
                    text: '<b>' + $filter('translate')('save_trip_save_button') + '</b>',
                    onTap: function (e) {
                        if (!$scope.data.nametrip) {
                            //Toast.show($filter('translate')("save_trip_error_message"), "short", "bottom");
                            $scope.showError = true;

                            e.preventDefault();
                        } else {
                            return $scope.data.nametrip;
                        }
                    }
                                }]
        }).then(function (res) {
            if (res) {
                planService.saveTrip($scope.tripId, $scope.trip, res, $scope.requestedFrom, $scope.requestedTo).then(function (res) {
                    planService.setEditInstance(null);
                    $scope.editMode = false;
                    $scope.tripId = res.tripId;
                    //toast saved
                    Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                    $ionicHistory.goBack();
                });
            }
        });


    }
    $scope.modifyTrip = function () {
        //get configuration with tripid
        planService.getTrip($scope.tripId).then(function (trip) {
            planService.setName("from", $scope.requestedFrom);
            planService.setName("to", $scope.requestedTo);
            planService.setPlanConfigure(trip.data.originalRequest);
            planService.setEditInstance(trip);
//            planService.setTripId($scope.tripId);
//            planService.setTripName(trip.data.name);
            $state.go('app.plan',{replan:true});
        });
        //        planService.setName("from", $scope.requestedFrom);
        //        planService.setName("to", $scope.requestedTo);
        //        planService.setTripId($scope.tripId);
        //        $state.go('app.plan');

    }
    $scope.deleteTrip = function () {
        $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
            planService.deleteTrip($scope.tripId).then(function (res) {
                //delete actual from localStorage and memory
                //go back in the stack

                $ionicHistory.goBack();
            });
        });

        //delete $scope.placesandcoordinates[favorite.name];
    }
    $scope.initMap = function () {
        mapService.initMap('planMapModal').then(function () {
            //add polyline
        })
    }

    $scope.bookmark = function() {
      bookmarkService.toggleBookmark($location.path(), $scope.tripName, 'TRIP').then(function(style) {
        $scope.bookmarkStyle = style;
      });
    };



})
