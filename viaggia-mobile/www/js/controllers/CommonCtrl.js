angular.module('viaggia.controllers.common', [])

.controller('AppCtrl', function ($scope, $state, $rootScope, $location, $ionicHistory, $timeout, DataManager, $ionicPopup, $ionicModal, $filter, $ionicLoading, Utils, $ionicSideMenuDelegate, loginService, Config, Toast, planService) {
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

    //open the popup for login
    $rootScope.login = function () {
        $scope.openLogin();
    }

    $rootScope.logout = function () {
        loginService.logout().then(function (data) {
                Toast.show($filter('translate')('sign_out_success'), "short", "bottom");
                $ionicSideMenuDelegate.toggleLeft();
                $state.go('app.home');
                $ionicHistory.nextViewOptions({
                    disableBack: true,
                    historyRoot: true
                });
            },
            function (error) {
                Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
            });
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

    $scope.plan = function () {
            planService.setPlanConfigure(null);
            $state.go('app.plan');
        }
        //Login and registration Modal managed with ng-include
    $ionicModal.fromTemplateUrl('templates/loginRegModal.html', {
        id: '4',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.templateLogin = 'templates/loginTemplate.html';
        $scope.loginModal = modal;
    });
    $scope.closeLogin = function () {
        $scope.loginModal.hide();
        $scope.templateLogin = 'templates/loginTemplate.html';

    };
    $scope.openLogin = function () {
        $scope.loginModal.show();
    }

    $scope.popupLoadingShow = function () {
        $ionicLoading.show({
            template: $filter('translate')("pop_up_loading")
        });
    };
    $scope.popupLoadingHide = function () {
        $ionicLoading.hide();
    };

    $scope.popupLogin = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: $filter('translate')('login_popup_title'),
            template: $filter('translate')('login_popup_template')
        });

        confirmPopup.then(function (res) {
            if (res) {
                $scope.openLogin();
            }
        });
    }
    $scope.goRegister = function () {
        $scope.templateLogin = 'templates/registrationTemplate.html';
    }
    $scope.backToLogin = function () {
        $scope.templateLogin = 'templates/loginTemplate.html';
    }
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

    $scope.getRecurrentDays = function (recurrency) {
        var returnDays = [];
        var empty_rec = Config.getDaysRec()
        for (var k = 0; k < empty_rec.length; k++) {
            if (Utils.contains(recurrency.daysOfWeek, k + 1)) {
                returnDays.push(empty_rec[k]);
            }
        }
        return returnDays;
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

    Config.init().then(function () {
        $scope.infomenu = Config.getInfoMenu();
        $scope.version = Config.getVersion();
        $scope.shownGroup = JSON.parse(localStorage.getItem(Config.getAppId() + '_shownGroup')) || false;
        $scope.contactLink = Config.getContactLink();
        $scope.taxiEnabled = (Config.getTaxiId() != 'undefined');
        if (loginService.userIsLogged()) {
            $rootScope.userIsLogged = true;
        } else {
            $rootScope.userIsLogged = false;
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
    .factory('Utils', function ($rootScope, $timeout, $ionicPopup, $cordovaToast) {
        return {
            contains: function (a, obj) {
                for (var i = 0; i < a.length; i++) {
                    if (a[i] === obj) {
                        return true;
                    }
                }
                return false;
            },
            getDaysOfRecurrency: function (days) {
                var returndays = [];
                for (var len = 0; len < days.length; len++) {
                    if (days[len].checked) {
                        returndays.push(len + 1);
                    }
                }
                return returndays;
            }
        };

    })
    .controller('TutorialCtrl', function ($scope, $ionicLoading) {});
