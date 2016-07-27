angular.module('viaggia.controllers.login', [])

.controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, $rootScope, $ionicLoading, $ionicPlatform, $state, $ionicHistory, $ionicPopup, $timeout, $filter, loginService, userService, Config, storageService, Toast) {
    $ionicSideMenuDelegate.canDragContent(false);
    $scope.title = Config.getAppName();

    $scope.user = {
        email: '',
        password: ''
    };

    // This method is executed when the user press the "Sign in with Google" button
    $scope.googleSignIn = function () {
        $ionicLoading.show({
            template: 'Logging in...'
        });
        $timeout(function () {
            $ionicLoading.hide(); //close the popup after 3 seconds for some reason
        }, 3000);
        loginService.login(null, 'google').then(function (profile) {
            //                                       check if user is valid
            $ionicLoading.show({
                template: $filter('translate')('user_check')
            });
            storageService.saveUser(profile);
            $state.go('app.home');
            $ionicHistory.nextViewOptions({
                disableBack: true,
                historyRoot: true
            });
            $scope.closeLogin();
            Toast.show($filter('translate')('sign_in_success'), "short", "bottom");
            $rootScope.userIsLogged = true;

        }, function (err) {
            Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
            $ionicLoading.hide();
        }).finally(Config.loaded);


    }

    var fbLoginSuccess = function (response) {
        if (!response.authResponse) {
            fbLoginError("Cannot find the authResponse");
            return;
        }

        var authResponse = response.authResponse;

        getFacebookProfileInfo(authResponse)
            .then(function (profileInfo) {
                //for the purpose of this example I will store user data on local storage
                UserService.setUser({
                    authResponse: authResponse,
                    userID: profileInfo.id,
                    name: profileInfo.name,
                    email: profileInfo.email,
                    picture: "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
                });

                //$ionicLoading.hide();
                $state.go('app.home');

            }, function (fail) {
                //fail get profile info
                $ionicLoading.hide();
                console.log('profile info fail', fail);
            });
    };


    //This is the fail callback from the login method
    var fbLoginError = function (error) {
        console.log('fbLoginError', error);
        $ionicLoading.hide();
    };

    //this method is to get the user profile info from the facebook api
    var getFacebookProfileInfo = function (authResponse) {
        var info = $q.defer();

        facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
            function (response) {
                console.log(response);
                info.resolve(response);
            },
            function (response) {
                console.log(response);
                $ionicLoading.hide();
                info.reject(response);
            }
        );
        return info.promise;
    };

    $scope.facebookSignIn = function () {
        $ionicLoading.show({
            template: 'Logging in...'
        });
        $timeout(function () {
            $ionicLoading.hide(); //close the popup after 3 seconds for some reason
        }, 3000);
        loginService.login(null, 'facebook').then(function (profile) {
            //                                       check if user is valid
            $ionicLoading.show({
                template: $filter('translate')('user_check')
            });
            storageService.saveUser(profile);
            //go on to home page
            $state.go('app.home');
            $ionicHistory.nextViewOptions({
                disableBack: true,
                historyRoot: true
            });
            $scope.closeLogin();
            Toast.show($filter('translate')('sign_in_success'), "short", "bottom");
            $rootScope.userIsLogged = true;

        }, function (err) {
            Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
            $ionicLoading.hide();
        }).finally(Config.loaded);


    }



    function validateUserPopup() {
        var buttons = [
            {
                text: $filter('translate')('btn_close'),
                type: 'button-close',
                onTap: function (e) {
                    //close app
                    ionic.Platform.exitApp();
                }
          },
            {
                text: $filter('translate')('btn_validate_user'),
                onTap: function (e) {
                    $ionicLoading.show();

                    registrationForm();
                }
        }];
        if (ionic.Platform.isIOS()) {
            buttons.splice(0, 1);
        }
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
        if (window.cordova && window.cordova.plugins.screenorientation) {
            screen.unlockOrientation()
        }
    });
    $scope.$on('$ionicView.beforeEnter', function () {
        //        $ionicLoading.show({
        //            template: $filter('translate')('user_check')
        //        });

    });
    $ionicPlatform.ready(function () {
        Config.init().then(function () {
            if (window.cordova && window.cordova.plugins.screenorientation) {
                screen.lockOrientation('portrait');
            }

            //            $scope.$on('$ionicView.enter', function () {
            //                $ionicLoading.hide();
            //            });
            userService.getValidToken().then(function (validToken) {
                var profile = storageService.getUser();
                //$scope.validateUserForGamification(profile);

            }, function (err) {
                $ionicLoading.hide();
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
        loginService.signin($scope.user).then(
            function (profile) {
                $ionicLoading.show({
                    template: $filter('translate')('user_check')
                });
                storageService.saveUser(profile);
                $state.go('app.home');
                $ionicHistory.nextViewOptions({
                    disableBack: true,
                    historyRoot: true
                });
                $scope.closeLogin();
                Toast.show($filter('translate')('sign_in_success'), "short", "bottom");
                $rootScope.userIsLogged = true;
            },
            function (error) {
                storageService.saveUser(null);
                $ionicPopup.alert({
                    title: $filter('translate')('error_popup_title'),
                    template: $filter('translate')('error_signin')
                });

            }
        ).finally(Config.loaded);
    };

})


.controller('RegisterCtrl', function ($scope, $rootScope, $state, $filter, $ionicHistory, $ionicPopup, $translate, loginService, Config) {
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
        loginService.register($scope.user).then(
            function (data) {
                $state.go('app.signupsuccess');
            },
            function (error) {
                var errorMsg = 'error_generic';
                if (error == 409) {
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
