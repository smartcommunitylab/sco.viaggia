angular.module('viaggia.controllers.login', [])

    .controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, DiaryDbSrv, $ionicLoading, $ionicPlatform, $state, $ionicHistory, $ionicPopup, $timeout, $filter, LoginService, GameSrv, Config, Toast, notificationService) {
        $ionicSideMenuDelegate.canDragContent(false);


        $scope.user = {
            email: '',
            password: ''
        };


        function onDeviceReady () {
            notificationService.registerUser();
        }
        // This method is executed when the user press the "Sign in with Google" button
        $scope.googleSignIn = function () {
            // $ionicLoading.show({
            //     template: 'Logging in...'
            // });
            // $timeout(function () {
            //     $ionicLoading.hide(); //close the popup after 3 seconds for some reason
            // }, 3000);
            LoginService.login(LoginService.PROVIDER.GOOGLE).then(function (profile) {
                //                                       check if user is valid
                $ionicLoading.show({
                    template: $filter('translate')('user_check')
                });
                GameSrv.validUserForGamification(profile).then(function (valid) {
                    //$ionicLoading.hide();

                    if (valid) {
                        //reg push notification, not blocking
                        document.addEventListener('deviceready', onDeviceReady, false);
                                                //go on to home page
                        $state.go('app.home');
                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });

                    } else {
                        // open popup for validating user
                        $ionicLoading.hide();
                        validateUserPopup();
                    }
                    DiaryDbSrv.dbSetup().then(function () {
                    }, function (err) {
                        //diary db not worked
                    });

                },
                    function (msg) {
                        Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                        $ionicLoading.hide();
                    });
            }, function (err) {
                Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                $ionicLoading.hide();
            });
        }
        //This is the success callback from the login method
        $scope.validateUserForGamification = function (profile) {
            if (profile != null) {
                GameSrv.validUserForGamification(profile).then(function (valid) {
                    $ionicLoading.hide();
                    if (valid) {
                        $ionicLoading.show({
                            template: $filter('translate')('user_check')
                        });
                        //reg push notification, not blocking
                        document.addEventListener('deviceready', onDeviceReady, false);                        //go on to home page
                        $state.go('app.home');
                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });
                    } else {
                        // open popup for validating user
                        $ionicLoading.hide();
                        validateUserPopup();
                    }
                    DiaryDbSrv.dbSetup().then(function () {
                    }, function (err) {
                        //diary db not worked
                    });

                }, function (error) {
                    Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                    $ionicLoading.hide();
                    checkValidNoNetworkAndGoHome(profile);
                });
            }
        }

        $scope.facebookSignIn = function () {
            $ionicLoading.show({
                template: 'Logging in...'
            });
            $timeout(function () {
                $ionicLoading.hide(); //close the popup after 3 seconds for some reason
            }, 3000);
            LoginService.login(LoginService.PROVIDER.FACEBOOK).then(function (profile) {
                //                                       check if user is valid
                $ionicLoading.show({
                    template: $filter('translate')('user_check')
                });
                GameSrv.validUserForGamification(profile).then(function (valid) {
                    //$ionicLoading.hide();

                    if (valid) {
                        //reg push notification, not blocking
                        document.addEventListener('deviceready', onDeviceReady, false);                        //go on to home page
                        $state.go('app.home');
                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });
                    } else {
                        // open popup for validating user
                        $ionicLoading.hide();
                        validateUserPopup();
                    }
                    DiaryDbSrv.dbSetup().then(function () {
                    }, function (err) {
                        //diary db not worked
                    });
                },
                    function (msg) {
                        Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                        $ionicLoading.hide();
                    });
            }, function (err) {
                Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                $ionicLoading.hide();
            });


        }

        function validateUserPopup() {
            var buttons = [
                {
                    text: $filter('translate')('btn_close'),
                    type: 'button-close',
                    onTap: function (e) {
                        //close app
                        LoginService.logout().then(ionic.Platform.exitApp, ionic.Platform.exitApp);
                    }
                },
                {
                    text: $filter('translate')('btn_validate_user'),
                    onTap: function (e) {
                        $ionicLoading.show();
                        registrationForm();
                    }
                }];
            // if (ionic.Platform.isIOS()) {
            //     buttons.splice(0, 1);
            // }
            $scope.validatePopup = $ionicPopup.show({
                templateUrl: 'templates/validateUserPopup.html',
                title: $filter('translate')('lbl_validateuser'),
                cssClass: 'parking-popup',
                scope: $scope,
                buttons: buttons
            });

        }

        function registrationForm() {
            $state.go('app.registration');

        }
        $scope.$on('$ionicView.leave', function () {
            $ionicSideMenuDelegate.canDragContent(true);
            //$ionicLoading.hide();
            if (window.cordova && window.cordova.plugins.screenorientation && screen.unlockOrientation) {
                screen.unlockOrientation()
            }
        });
        $scope.$on('$ionicView.beforeEnter', function () {
            //        $ionicLoading.show({
            //            template: $filter('translate')('user_check')
            //        });

        });

        var checkValidNoNetworkAndGoHome = function (profile) {
            var locallyValid = GameSrv.validUserForGamificationLocal();
            DiaryDbSrv.dbSetup().then(function () {
            }, function (err) {
                //diary db not worked
            });
            if (profile != null && locallyValid) {
                //reg push notification, not blocking
                document.addEventListener('deviceready', onDeviceReady, false);                $state.go('app.home');
                $ionicHistory.nextViewOptions({
                    disableBack: true,
                    historyRoot: true
                });
            }
        }

        $ionicPlatform.ready(function () {
            Config.init().then(function () {
                if (window.cordova && window.cordova.plugins.screenorientation && screen.lockOrientation) {
                    screen.lockOrientation('portrait');
                }

                //            $scope.$on('$ionicView.enter', function () {
                //                $ionicLoading.hide();
                //            });
                $ionicLoading.show();
                LoginService.getValidAACtoken().then(function (validToken) {
                    var profile = LoginService.getUserProfile();
                    $scope.validateUserForGamification(profile);

                }, function (err) {
                    $ionicLoading.hide();
                    var profile = LoginService.getUserProfile();
                    checkValidNoNetworkAndGoHome(profile);
                })
            });

        });

        $scope.goRegister = function () {
            $state.go('app.signup');
        }

        $scope.passwordRecover = function () {
            window.open(Config.getAACURL() + '/internal/reset?lang=en', '_system', 'location=no,toolbar=no')
        }
        $scope.signin = function () {
            Config.loading();
            LoginService.login(LoginService.PROVIDER.INTERNAL, $scope.user).then(
                function (profile) {
                    $ionicLoading.show({
                        template: $filter('translate')('user_check')
                    });
                    GameSrv.validUserForGamification(profile).then(function (valid) {
                        //$ionicLoading.hide();
                        if (valid) {
                            //reg push notification, not blocking
                            document.addEventListener('deviceready', onDeviceReady, false);                            //go on to home page
                            $state.go('app.home');
                            $ionicHistory.nextViewOptions({
                                disableBack: true,
                                historyRoot: true
                            });
                        } else {
                            // open popup for validating user
                            $ionicLoading.hide();
                            validateUserPopup();
                        }
                        DiaryDbSrv.dbSetup().then(function () {
                        }, function (err) {
                            //diary db not worked
                        });
                    },
                        function (msg) {
                            Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                            $ionicLoading.hide();
                        });
                },
                function (error) {
                    $ionicPopup.alert({
                        title: $filter('translate')('error_popup_title'),
                        template: $filter('translate')('error_signin')
                    });

                }
            ).finally(Config.loaded);
        };

    })


    .controller('RegisterCtrl', function ($scope, $rootScope, $state, $filter, $ionicHistory, $ionicPopup, $translate, LoginService, Config) {
        $scope.user = {
            lang: $translate.preferredLanguage(),
            name: '',
            surname: '',
            email: '',
            password: ''
        };

        var validate = function () {
            if (!$scope.user.name.trim() || !$scope.user.surname.trim() || !$scope.user.email.trim() || !$scope.user.password.trim()) {
                return 'error_required_fields';
            }
            if ($scope.user.password.trim().length < 6) {
                return 'error_password_short';
            }
            return null;
        };

        $scope.toLogin = function () {
            window.location.hash = '';
            window.location.reload(true);
        }

        $scope.resend = function () {
            window.open(Config.getAACURL() + '/internal/resend?lang=en', '_system', 'location=no,toolbar=no')
        }


        $scope.register = function () {
            var msg = validate();
            if (msg) {
                $ionicPopup.alert({
                    title: $filter('translate')('error_popup_title'),
                    template: $filter('translate')(msg)
                });
                return;
            }

            Config.loading();
            LoginService.register($scope.user).then(
                function (data) {
                    $state.go('app.signupsuccess');
                },
                function (error) {
                    var errorMsg = 'error_generic';
                    if (error.status == 409) {
                        errorMsg = 'error_email_inuse';
                    }
                    $ionicPopup.alert({
                        title: $filter('translate')('error_popup_title'),
                        template: $filter('translate')(errorMsg)
                    });
                }
            ).finally(Config.loaded);
        };
    });
