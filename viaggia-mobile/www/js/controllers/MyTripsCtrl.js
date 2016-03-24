angular.module('viaggia.controllers.mytrips', [])

.controller('MyTripsCtrl', function ($scope, Config, $timeout, $filter, ionicMaterialMotion, ionicMaterialInk, planService, $state) {

    planService.getTrips().then(function (data) {
      var array = [];
      if (data) {
        for (var key in data) {
          array.push(data[key]);
        }
      }
      array.sort(function(t1,t2) {
        return t2.data.startime - t1.data.startime;
      });

      $scope.savedTrips = array;
    });
    $scope.$on('ngLastRepeat.savedTrips', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }, 0); // No timeout delay necessary.
    });

    $scope.showPlan = function (journey) {
        $state.go('app.tripdetails', {
            tripId: journey.clientId
        });
    }
    $scope.isRecurrency = function (trip) {
        if (trip.recurrency && trip.recurrency.daysOfWeek && trip.recurrency.daysOfWeek.length > 0) {
            return true;
        }
        return false;
    }

    $scope.deleteTrip = function($index) {
        $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
            var journey = $scope.savedTrips[$index];
            Config.loading();
            planService.deleteTrip(journey.clientId).then(function (res) {
              $scope.savedTrips.splice($index,1);
            }).finally(Config.loaded);
        });

        //delete $scope.placesandcoordinates[favorite.name];
    }
})
