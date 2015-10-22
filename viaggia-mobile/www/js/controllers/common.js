angular.module('viaggia.controllers.common', [])

.controller('AppCtrl', function ($scope, $rootScope, $location, $timeout, DataManager, $ionicLoading) {

    $scope.popupLoadingShow = function () {
        $ionicLoading.show({
            template: 'Loading...'
        });
    };
    $scope.popupLoadingHide = function () {
        $ionicLoading.hide();
    };

})



.controller('TutorialCtrl', function ($scope, $ionicLoading) {});
