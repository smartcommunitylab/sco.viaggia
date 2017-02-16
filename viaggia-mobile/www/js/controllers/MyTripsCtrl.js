angular.module('viaggia.controllers.mytrips', [])
  /*
  Controller that manages the view with my trips and let the user show them, delete them and modify them
  */
  .controller('MyTripsCtrl', function ($scope, Config, $timeout, ionicMaterialMotion, ionicMaterialInk, planService, $state, $filter) {

    //get the saved trips (currently from localStorage)
    planService.getTrips().then(function (data) {
      $scope.savedTripsDB = data;
      $scope.savedTripsKeys = [];
      if ($scope.savedTripsDB) {
        $scope.savedTripsKeys = Object.keys($scope.savedTripsDB);
      }
      $scope.savedTrips = [];
      for (var k = 0; k < $scope.savedTripsKeys.length; k++) {
        $scope.savedTrips.push($scope.savedTripsDB[$scope.savedTripsKeys[k]]);
      }
    });

    $scope.$on('ngLastRepeat.savedTrips', function (e) {
      $timeout(function () {
        ionicMaterialMotion.ripple();
        ionicMaterialInk.displayEffect()
      }, 0); // No timeout delay necessary.
    });

    //open the details page passing the id for parameter
    $scope.showPlan = function (journey) {
      $state.go('app.tripdetails', {
        tripId: journey.tripId
      });
    }

    //open the popup for confirm the delating. If user press yes, delete the trip at $index position
    $scope.deleteTrip = function ($index) {
      var journey = $scope.savedTrips[$index];
      $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
        Config.loading();
        planService.deleteTrip(journey.tripId).then(function (res) {
          $scope.savedTrips.splice($index, 1);
        }).finally(Config.loaded);
      });
    }


    //modify the saved trip setting the configuration in planService, parameters and moving to the new state
    $scope.modifyTrip = function ($index) {
      var journey = $scope.savedTrips[$index];
      $scope.showConfirm($filter('translate')("popup_modify_trip_message"), $filter('translate')("popup_modify_trip_title"), function () {
        Config.loading();
        planService.getTrip(journey.tripId).then(function (trip) {
          if (trip.data) {
            planService.setName("from", trip.data.originalFrom.name);
            planService.setName("to", trip.data.originalTo.name);
            planService.setPlanConfigure(planService.buildConfigureOptions(trip));
            planService.setEditInstance(trip);
            var params = {
              replan: true,
              tripId: journey.clientId
            }
            $state.go('app.plan', params);
          }
        }).finally(Config.loaded);
      });
    }
  })
