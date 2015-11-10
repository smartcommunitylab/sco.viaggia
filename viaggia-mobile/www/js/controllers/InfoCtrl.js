angular.module('viaggia.controllers.info', [])

.controller('InfoCtrl', function ($scope) {
})

.controller('ParkingCtrl', function ($scope, $stateParams, $timeout, parkingService, Config) {
  $scope.agencyId = $stateParams.agencyId;
  $scope.parkings = null;

  var init = function() {
    Config.loading();
    parkingService.getParkings($scope.agencyId).then(function(data){
      $scope.parkings = data;
      $scope.parkings.forEach(function(e) {
        if (e.monitored && e.slotsAvailable > -2) {
          e.availLevel = e.slotsAvailable <= 5 ? 'avail-red' : e.slotsAvailable > 20 ? 'avail-green' : 'avail-yellow';
        }
      });
      Config.loaded();
    }, function (err) {
      $scope.parkings = null;
      Config.loaded();
    });
  }

  $timeout(init,200);
})


