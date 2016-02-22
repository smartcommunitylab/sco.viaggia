angular.module('viaggia.controllers.login', [])

.controller('LoginCtrl', function ($scope, $ionicSideMenuDelegate, $ionicLoading, $state, $ionicHistory, loginService) {
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
                loginService.setGoogleUser({
                    userID: user_data.userId,
                    name: user_data.displayName,
                    email: user_data.email,
                    picture: user_data.imageUrl,
                    oauthToken: user_data.oauthToken,
                    idToken: user_data.idToken
                });

                $ionicLoading.hide();

                //$state.go('app.home');
                loginService.setGoogleToken(user_data.oauthToken);
                loginService.login(user_data.oauthToken, 'googlelocal').then(function (profile) {
                    //check if user is valid
                    $state.go('app.home');
                    $ionicHistory.nextViewOptions({
                        disableBack: true,
                        historyRoot: true
                    });
                });
            },
            function (msg) {
                $ionicLoading.hide();
            }
        );
    }
});
