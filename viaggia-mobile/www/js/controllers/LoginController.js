angular.module('viaggia.controllers.login', [])

.controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, $ionicLoading, $state, $ionicHistory, $ionicPopup, $filter, loginService, userService) {
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
                    userService.validUserForGamification().then(function (valid) {
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

                    }

                },
                {
                    text: $filter('translate')('btn_validate_user'),
                    onTap: function (e) {
                        $state.go('app.home');
                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });
                    }

                }
                ]
        });

    }
});
