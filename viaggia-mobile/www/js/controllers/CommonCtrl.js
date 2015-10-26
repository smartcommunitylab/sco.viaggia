angular.module('viaggia.controllers.common', [])

.controller('AppCtrl', function ($scope, $rootScope, $location, $timeout, DataManager, $ionicLoading) {

    $scope.toggleGroupRealTime = function () {
        if ($scope.isGroupRealTimeShown()) {
            $scope.shownGroup = false;
        } else {
            $scope.shownGroup = true;
        }
    };
    $scope.isGroupRealTimeShown = function () {
        return $scope.shownGroup === true;
    };
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
