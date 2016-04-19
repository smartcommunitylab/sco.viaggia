angular.module('viaggia.controllers.login', [])

.controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, $ionicLoading, $ionicPlatform, $state, $ionicHistory, $ionicPopup, $timeout, $filter, loginService, userService, Config, storageService, Toast) {
    $ionicSideMenuDelegate.canDragContent(false);



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
                userService.validUserForGamification(profile).then(function (valid) {
                        //$ionicLoading.hide();
                        storageService.saveUser(profile);

                        if (valid) {
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

                    },
                    function (msg) {
                        Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                        $ionicLoading.hide();
                    });
            }, function (err) {
                Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                $ionicLoading.hide();
            });

            //            window.plugins.googleplus.login({
            //                    //                    'scopes': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            //                    'scopes': 'profile email',
            //                    'offline': true
            //                },
            //                function (user_data) {
            //                    userService.setGoogleUser({
            //                        userID: user_data.userId,
            //                        name: user_data.displayName,
            //                        email: user_data.email,
            //                        picture: user_data.imageUrl,
            //                        oauthToken: user_data.oauthToken,
            //                        idToken: user_data.idToken
            //                    });
            //
            //                    $ionicLoading.hide();
            //
            //                    //$state.go('app.home');
            //                    userService.setGoogleToken(user_data.oauthToken);
            //                    loginService.login(user_data.oauthToken ? user_data.oauthToken : user_data.accessToken, 'googlelocal').then(function (profile) {
            //                        //check if user is valid
            //
            //                        $scope.validateUserForGamification(profile);
            //
            //                    })
            //                },
            //                function (msg) {
            //                    $ionicLoading.hide();
            //                    Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
            //
            //                }
            //            );
        }
        //This is the success callback from the login method
    $scope.validateUserForGamification = function (profile) {
        if (profile != null) {
            userService.validUserForGamification(profile).then(function (valid) {
                if (valid) {
                    $ionicLoading.show({
                        template: $filter('translate')('user_check')
                    });
                    //memorize profile;
                    storageService.saveUser(profile);
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

            }, function (error) {
                Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                $ionicLoading.hide();
            });
        }
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
            userService.validUserForGamification(profile).then(function (valid) {
                    //$ionicLoading.hide();
                    storageService.saveUser(profile);

                    if (valid) {
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

    //    function validateUserPopup() {
    //        $ionicPopup.show({
    //            templateUrl: 'templates/validateUserPopup.html',
    //            title: $filter('translate')('lbl_validateuser'),
    //            cssClass: 'parking-popup',
    //            scope: $scope,
    //            buttons: [
    //                {
    //                    text: $filter('translate')('btn_close'),
    //                    type: 'button-close',
    //                    onTap: function (e) {
    //                        //close app
    //                        ionic.Platform.exitApp();
    //                    }
    //
    //                },
    //                {
    //                    text: $filter('translate')('btn_validate_user'),
    //                    onTap: function (e) {
    //                        userService.getValidToken().then(function (validToken) {
    //                            var url = Config.getGamificationURL() + "/mobile?token=" + validToken;
    //                            window.open(url, "_system", "location=yes");
    //                            //$timeout(ionic.Platform.exitApp(), 1000);
    //                        });
    //
    //
    //                    }
    //
    //                }
    //                ]
    //        });
    //
    //    }
    //    $ionicModal.fromTemplateUrl('templates/registrationFormModal.html', {
    //        id: '1',
    //        scope: $scope,
    //        backdropClickToClose: false,
    //        animation: 'slide-in-up'
    //    }).then(function (modal) {
    //        //mapService.initMap('planMapModal');
    //        $scope.registrationModal = modal;
    //    });

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
                    //                        userService.getValidToken().then(function (validToken) {
                    //                            var url = Config.getGamificationURL() + "/mobile?token=" + validToken;
                    //                            window.open(url, "_system", "location=yes");
                    //                            //$timeout(ionic.Platform.exitApp(), 1000);
                    //                        });
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
        $ionicLoading.show({
            template: $filter('translate')('user_check')
        });

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
                $scope.validateUserForGamification(profile);

            }, function (err) {
                $ionicLoading.hide();
            })
        });

    });
});
