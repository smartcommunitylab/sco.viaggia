angular.module('viaggia.controllers.common', [])

.controller('AppCtrl', function ($scope, $state, $rootScope, $location, $timeout, DataManager, $ionicPopup, $ionicModal, $filter, $ionicLoading, Config, planService) {
    /*menu group*/
    $scope.shownGroup = false;
    $scope.toggleGroupRealTime = function () {
        if ($scope.isGroupRealTimeShown()) {
            $scope.shownGroup = false;
        } else {
            $scope.shownGroup = true;
        }
        localStorage.setItem(Config.getAppId() + '_shownGroup', $scope.shownGroup);

    };
    $scope.isGroupRealTimeShown = function () {
        return $scope.shownGroup === true;
    };

    $ionicModal.fromTemplateUrl('templates/credits.html', {
        id: '3',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.creditsModal = modal;
    });
    $scope.closeCredits = function () {
        $scope.creditsModal.hide();
    };
    $scope.openCredits = function () {
            $scope.creditsModal.show();
        }
        /*pop up managers*/
        //    $scope.newPlan = function () {
        //        planService.setTripId(null); //reset data for pianification
        //        $state.go('app.plan');
        //    };
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
                    type: 'button-cancel'
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
    $scope.showExpiredPopup = function () {
        var alertPopup = $ionicPopup.alert({
            title: $filter('translate')("pop_up_expired_title"),
            template: $filter('translate')("pop_up__expired_template"),
            buttons: [
                {
                    text: $filter('translate')("pop_up_ok"),
                    type: 'button-custom',
                    onTap: function (e) {
                        ionic.Platform.exitApp();
                    }
                            }
            ]
        });
    }
    $scope.showNotExpiredPopup = function (date) {
        var alertPopup = $ionicPopup.alert({
            title: $filter('translate')("pop_up_not_expired_title"),
            template: $filter('translate')("pop_up_not_expired_template") + date,
            buttons: [
                {
                    text: $filter('translate')("pop_up_ok"),
                    type: 'button-custom'
                            }
            ]
        });
    }
    $scope.isExpired = function () {
        //check in config if expirationDate is > of today
        //        var expirationDateString = Config.getExpirationDate();
        //        var expirationDate
        var expirationDateString = Config.getExpirationDate();
        var pattern = /(\d{2})-(\d{2})-(\d{4})/;
        var expirationDate = new Date(expirationDateString.replace(pattern, '$3-$2-$1'));
        expirationDate = expirationDate.getTime();
        var today = new Date().getTime();
        if (expirationDate < today) {
            return true;
        } else if (expirationDate > today) {
            return false;
        }

    }
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

    Config.init().then(function () {
        $scope.infomenu = Config.getInfoMenu();
        $scope.version = Config.getVersion();
        $scope.shownGroup = JSON.parse(localStorage.getItem(Config.getAppId() + '_shownGroup')) || false;
        $scope.contactLink = Config.getContactLink();
        $scope.taxiEnabled = (Config.getTaxiId() != 'undefined');
        if (!$scope.isExpired()) {
            $scope.showNotExpiredPopup(Config.getExpirationDate());
        } else {
            $scope.showExpiredPopup();
        }
    });

    $scope.selectInfomenu = function (m) {
        //      m.data.label = m.label;
        //      Config.setInfoMenuParams(m.data);
        //      $state.go(m.state);
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
