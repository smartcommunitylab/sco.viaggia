angular.module('viaggia.controllers.pois', [])

/*

Controller that manages the POIs

*/

.controller('POIsCtrl', function ($scope, $state, Config, poiService) {
    $scope.pois = null;
    $scope.lang = Config.getLang();
    
    Config.loading();
    poiService.getPOIs().then(function(data){
      $scope.pois = data;
      Config.loaded();
    }, function(err) {
      $scope.pois = [];  
      Config.loaded();
    });  
  
    $scope.view = function(id) {
      $state.go('app.poi',{poiId:id});
    }
})

.controller('POICtrl', function ($scope, $state, $stateParams, Config, poiService, planService) {
    $scope.lang = Config.getLang();

    Config.loading();
    poiService.getPOI($stateParams.poiId).then(function(poi){
      $scope.poi = poi;
      Config.loaded();      
    }, function(err) {
      Config.loaded();      
    });
  
  
    $scope.navigate = function () {
        planService.setPlanConfigure({
            to: {
                name: $scope.poi.properties.title[$scope.lang],
                lat: $scope.poi.geometry.coordinates[0],
                long: $scope.poi.geometry.coordinates[1]
            },
        });
        planService.setName('to', $scope.poi.properties.title[$scope.lang]);
        $state.go('app.plan');
    };

})
