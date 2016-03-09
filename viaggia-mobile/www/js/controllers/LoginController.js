angular.module('viaggia.controllers.login', [])

.controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, $ionicLoading, $state, $ionicHistory, $ionicPopup, $filter, loginService, userService, Config) {
    $ionicSideMenuDelegate.canDragContent(false);
    $scope.$on('$ionicView.leave', function () {
        $ionicSideMenuDelegate.canDragContent(true);
    });



    // This method is executed when the user press the "Sign in with Google" button
    $scope.googleSignIn = function () {
            $ionicLoading.show({
                template: 'Logging in...'
            });

            window.plugins.googleplus.login({
                    'scopes': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                    'offline': true
                },
                function (user_data) {
                    userService.setGoogleUser({
                        userID: user_data.userId,
                        name: user_data.displayName,
                        email: user_data.email,
                        picture: user_data.imageUrl,
                        oauthToken: user_data.oauthToken,
                        idToken: user_data.idToken
                    });

                    $ionicLoading.hide();

                    //$state.go('app.home');
                    userService.setGoogleToken(user_data.oauthToken);
                    loginService.login(user_data.oauthToken, 'googlelocal').then(function (profile) {
                        //check if user is valid
                        userService.validUserForGamification(profile).then(function (valid) {
                            if (valid) {
                                //go on to home page
                                $state.go('app.home');
                                $ionicHistory.nextViewOptions({
                                    disableBack: true,
                                    historyRoot: true
                                });
                            } else {
                                // open popup for validating user
                                validateUserPopup();
                            }

                        });
                    })
                },
                function (msg) {
                    $ionicLoading.hide();
                }
            );
        }
        //This is the success callback from the login method
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

                $ionicLoading.hide();
                $state.go('app.home');

            }, function (fail) {
                //fail get profile info
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
                info.reject(response);
            }
        );
        return info.promise;
    };

    $scope.facebookSignIn = function () {
        $ionicLoading.show({
            template: 'Logging in...'
        });
        loginService.login(null, 'facebook').then(function (profile) {
            //                                       check if user is valid
            userService.validUserForGamification(profile).then(function (valid) {
                    $ionicLoading.hide();

                    if (valid) {
                        //go on to home page
                        $state.go('app.home');
                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });
                    } else {
                        // open popup for validating user
                        validateUserPopup();
                    }

                },
                function (msg) {
                    $ionicLoading.hide();
                });
        });

        //        facebookConnectPlugin.getLoginStatus(function (success) {
        //            if (success.status === 'connected') {
        //                // the user is logged in and has authenticated your app, and response.authResponse supplies
        //                // the user's ID, a valid access token, a signed request, and the time the access token
        //                // and signed request each expire
        //                console.log('getLoginStatus', success.status);
        //
        //                //check if we have our user saved
        //                var user = UserService.getUser('facebook');
        //
        //                if (!user.userID) {
        //                    getFacebookProfileInfo(success.authResponse)
        //                        .then(function (profileInfo) {
        //
        //                            //for the purpose of this example I will store user data on local storage
        //                            UserService.setUser({
        //                                authResponse: success.authResponse,
        //                                userID: profileInfo.id,
        //                                name: profileInfo.name,
        //                                email: profileInfo.email,
        //                                picture: "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
        //                            });
        //                                loginService.login(user_data.oauthToken, 'facebooklocal').then(function (profile) {
        //                                //check if user is valid
        //                                userService.validUserForGamification().then(function (valid) {
        //                                    if (valid) {
        //                                        //go on to home page
        //                                        $state.go('app.home');
        //                                        $ionicHistory.nextViewOptions({
        //                                            disableBack: true,
        //                                            historyRoot: true
        //                                        });
        //                                    } else {
        //                                        // open popup for validating user
        //                                        validateUserPopup();
        //                                    }
        //
        //                                });
        //                            })
        //
        //                        }, function (fail) {
        //                            //fail get profile info
        //                            console.log('profile info fail', fail);
        //                        });
        //                } else {
        //                    $state.go('app.home');
        //                }
        //
        //            } else {
        //                //if (success.status === 'not_authorized') the user is logged in to Facebook, but has not authenticated your app
        //                //else The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
        //                console.log('getLoginStatus', success.status);
        //
        //                $ionicLoading.show({
        //                    template: 'Logging in...'
        //                });
        //
        //                //ask the permissions you need. You can learn more about FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        //                //facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
        //                var fbLoginSuccess1 = function (userData) {
        //                    console.log("UserInfo: ", userData);
        //                }
        //
        //                facebookConnectPlugin.login(["public_profile"], fbLoginSuccess1,
        //                    function loginError(error) {
        //                        console.error(error)
        //                    }
        //                );
        //            }
        //        });
        //        window.plugins.googleplus.login({
        //                'scopes': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        //                'offline': true
        //            },
        //            function (user_data) {
        //                userService.setGoogleUser({
        //                    userID: user_data.userId,
        //                    name: user_data.displayName,
        //                    email: user_data.email,
        //                    picture: user_data.imageUrl,
        //                    oauthToken: user_data.oauthToken,
        //                    idToken: user_data.idToken
        //                });
        //
        //                $ionicLoading.hide();
        //
        //                //$state.go('app.home');
        //                userService.setGoogleToken(user_data.oauthToken);
        //                loginService.login(user_data.oauthToken, 'googlelocal').then(function (profile) {
        //                    //check if user is valid
        //                    userService.validUserForGamification().then(function (valid) {
        //                        if (valid) {
        //                            //go on to home page
        //                            $state.go('app.home');
        //                            $ionicHistory.nextViewOptions({
        //                                disableBack: true,
        //                                historyRoot: true
        //                            });
        //                        } else {
        //                            // open popup for validating user
        //                            validateUserPopup();
        //                        }
        //
        //                    });
        //                })
        //            },
        //            function (msg) {
        //                $ionicLoading.hide();
        //            }
        //        );
    }

    function validateUserPopup() {
        $ionicPopup.show({
            templateUrl: 'templates/validateUserPopup.html',
            title: $filter('translate')('lbl_validateuser'),
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
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
                        //redirect to https://dev.smartcommunitylab.it/gamificationweb/mobile?token=aijcijiad
                        userService.getValidToken().then(function (validToken) {
                            var url = Config.getGamificationURL() + "/mobile?token=" + validToken;
                            window.open(url, "_system", "location=yes");
                        });

                        //                        $state.go('app.home');
                        //                        $ionicHistory.nextViewOptions({
                        //                            disableBack: true,
                        //                            historyRoot: true
                        //                        });
                    }

                }
                ]
        });

    }
});
