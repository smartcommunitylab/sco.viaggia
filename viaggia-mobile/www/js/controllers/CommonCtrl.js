angular.module('viaggia.controllers.common', [])

.controller('AppCtrl', function ($scope, $rootScope, $location, $timeout, DataManager, $ionicPopup, $filter, $ionicLoading) {

    /*menu group*/
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

    /*pop up managers*/
    $scope.popupLoadingShow = function () {
        $ionicLoading.show({
            template: $filter('translate')("pop_up_loading")
        });
    };
    $scope.popupLoadingHide = function () {
        $ionicLoading.hide();
    };

    $scope.showConfirm = function (template, title, functionOnTap) {
        var confirmPopup = $ionicPopup.confirm({
            title: title,
            template: template,
            buttons: [
                {
                    text: $filter('translate')("pop_up_cancel"),
                    type: 'button-custom'
                            },
                {
                    text: $filter('translate')("pop_up_ok"),
                    type: 'button-custom',
                    onTap: functionOnTap
                    }
            ]
        });
    }

    $scope.showNoConnection = function () {
        var alertPopup = $ionicPopup.alert({
            title: $filter('translate')("pop_up_no_connection_title"),
            template: $filter('translate')("pop_up__no_connection_template"),
            buttons: [
                {
                    text: $filter('translate')("pop_up_ok"),
                    type: 'button-custom'
                            }
            ]
        });
    };
    $scope.showErrorServer = function () {
        var alertPopup = $ionicPopup.alert({
            title: $filter('translate')("pop_up_error_server_title"),
            template: $filter('translate')("pop_up_error_server_template"),
            buttons: [
                {
                    text: $filter('translate')("pop_up_ok"),
                    type: 'button-custom'
                            }
            ]
        });
    };
})

.factory('Toast', function ($rootScope, $timeout, $ionicPopup, $cordovaToast) {
    return {
        show: function (message, duration, position) {
            message = message || "There was a problem...";
            duration = duration || 'short';
            position = position || 'top';

            if (!!window.cordova) {
                // Use the Cordova Toast plugin
                $cordovaToast.show(message, duration, position);
            } else {
                if (duration == 'short') {
                    duration = 2000;
                } else {
                    duration = 5000;
                }

                var myPopup = $ionicPopup.show({
                    template: "<div class='toast'>" + message + "</div>",
                    scope: $rootScope,
                    buttons: []
                });

                $timeout(function () {
                    myPopup.close();
                }, duration);
            }
        }
    };
})

.controller('TutorialCtrl', function ($scope, $ionicLoading) {});
