angular.module('viaggia.controllers.events', [])

/*

Controller that manages the EVENTs

*/

.controller('EVENTsCtrl', function ($scope, $state, Config, eventService) {
    $scope.events = null;
    $scope.lang = Config.getLang();
    
    Config.loading();
    eventService.getEVENTs().then(function(data){
      $scope.events = data;
      Config.loaded();
    }, function(err) {
      $scope.events = [];  
      Config.loaded();
    });  
  
    $scope.view = function(id) {
      $state.go('app.event',{eventId:id});
    }
})

.controller('EVENTCtrl', function ($scope, $state, $stateParams, Config, eventService, planService) {
    $scope.lang = Config.getLang();

    Config.loading();
    eventService.getEVENT($stateParams.eventId).then(function(event){
      $scope.event = event;
      Config.loaded();      
    }, function(err) {
      Config.loaded();      
    });
  
  
    $scope.navigate = function () {
        planService.setPlanConfigure({
            to: {
                name: $scope.event.properties.title[$scope.lang],
                lat: $scope.event.geometry.coordinates[0],
                long: $scope.event.geometry.coordinates[1]
            },
        });
        planService.setName('to', $scope.event.properties.title[$scope.lang]);
        $state.go('app.plan');
    };

})
