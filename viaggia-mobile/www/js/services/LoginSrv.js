angular.module('viaggia.services.login', [])


//
//A Service to work with login server's services
//
.factory('loginService', function ($q, $http, $rootScope, $ionicPlatform, Config, storageService) {
        var loginService = {};
        var facebookToken = null;
        var googleToken = null;
        var authWindow = null;

        loginService.userIsLogged = function () {
            return (storageService.getUser() != null);
        };

        loginService.login = function (token, provider) {

            var deferred = $q.defer();

            // log into the system and set userId
            var authapi = {
                authorize: function (url) {
                    var deferred = $q.defer();

                    var processThat = false;

                    //Build the OAuth consent page URL
                    var authUrl = Config.getAuthServerURL() + '/' + provider + '?client_id=' + Config.getClientId() + "&response_type=code&redirect_uri=" + Config.getRedirectUri() + "&token=" + token;

                    //Open the OAuth consent page in the InAppBrowser
                    if (!authWindow) {
                        authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');
                        processThat = !!authWindow;
                    }

                    var processURL = function (url, deferred, w) {
                        var success = /\?code=(.+)$/.exec(url);
                        var error = /\?error=(.+)$/.exec(url);
                        if (w && (success || error)) {
                            //Always close the browser when match is found
                            w.close();
                            authWindow = null;
                        }

                        if (success) {
                            var str = success[1];
                            if (str.substring(str.length - 1) == '#') {
                                str = str.substring(0, str.length - 1);
                            }

                            console.log('success:' + decodeURIComponent(str));

                            // make second http post token.
                            loginService.makeTokenPost(str).then(function (tokenInfo) {
                                        // append token info to data.
                                        tokenInfo.token = str;

                                        loginService.makeProfileCall(tokenInfo).then(function (profile) {
                                                profile.token = tokenInfo;
                                                // set expiry (after removing 1 hr).
                                                var t = new Date();
                                                t.setSeconds(t.getSeconds() + (profile.token.expires_in - 3600));
                                                profile.token.validUntil = t;

                                                deferred.resolve(profile);
                                            },
                                            function (error) {
                                                deferred.reject(error[1]);
                                            });
                                    },
                                    function (error) {
                                        deferred.reject(error[1]);
                                    })
                                //loginService.makeTokenPost(str).then();
                        } else if (error) {
                            //The user denied access to the app
                            deferred.reject({
                                error: error[1]
                            });
                        }
                    }

                    if (ionic.Platform.isWebView()) {
                        if (processThat) {
                            authWindow.addEventListener('loadstart', function (e) {
                                //console.log(e);
                                var url = e.url;
                                processURL(url, deferred, authWindow);
                            });
                        }
                    } else {
                        angular.element($window).bind('message', function (event) {
                            $rootScope.$apply(function () {
                                processURL(event.data, deferred);
                            });
                        });
                    }

                    return deferred.promise;
                }
            };

            authapi.authorize().then(
                function (profile) {
                    console.log('success: ' + profile.userId);
                    storageService.saveUser(profile).then(function () {
                        deferred.resolve(profile);
                    }, function (reason) {
                        storageService.saveUser(null).then(function () {
                            deferred.reject(reason);
                        });
                    });
                }
            );

            return deferred.promise;
        };
        loginService.makeTokenPost = function makeTokenPost(code) {

            var deferred = $q.defer();

            var url = Config.getServerTokenURL();
            var params = "?client_id=" + Config.getClientId() + "&client_secret=" + Config.getClientSecKey() + "&code=" + code + "&redirect_uri=" + Config.getRedirectUri() + "&grant_type=authorization_code";

            $http.post(url + params)

            .then(
                function (response) {
                    if (response.data.access_token) {
                        deferred.resolve(response.data);
                    } else {
                        deferred.resolve(null);
                    }


                },
                function (responseError) {
                    deferred.reject(responseError);
                }
            );


            return deferred.promise;

        }

        loginService.makeProfileCall = function makeProfileCall(tokenInfo) {

            var deferred = $q.defer();

            var url = Config.getServerProfileURL();

            $http.get(url, {
                headers: {
                    "Authorization": "Bearer " + tokenInfo.access_token
                }
            })

            .then(
                function (response) {
                    if (response.data.userId) {
                        deferred.resolve(response.data);
                    } else {
                        deferred.resolve(null);
                    }


                },
                function (responseError) {
                    deferred.reject(responseError);
                }
            );

            return deferred.promise;

        }
    })
    .factory('userService', function ($http, $q, Config) {
        var userService = {};


        userService.setGoogleUser = function (user_data) {
            window.localStorage.starter_google_user = JSON.stringify(user_data);
        };
        userService.seFacebookUser = function (user_data) {
            window.localStorage.starter_facebook_user = JSON.stringify(user_data);
        };
        userService.getGoogleUser = function () {
            return JSON.parse(window.localStorage.starter_google_user || '{}');
        };

        userService.getFacebookUser = function () {
            return JSON.parse(window.localStorage.starter_facebook_user || '{}');
        };
        userService.getFacebookToken = function () {
            return facebookToken;
        }
        userService.getGoogleToken = function () {
            return googleToken;

        }
        userService.setFacebookToken = function (token) {
            facebookToken = token;
        }
        userService.setGoogleToken = function (token) {
            googleToken = token;
        }
        return userService;
    })
    .factory('storageService', function ($http, $q, Config) {
        var storageService = {};

        storageService.getUserId = function () {
            if (!!localStorage['userId']) {
                return localStorage['userId'];
            }
            return null;
        };

        storageService.saveUserId = function (userId) {
            var deferred = $q.defer();

            if (!!userId) {
                localStorage['userId'] = userId;
            } else {
                localStorage.removeItem('userId');
            }

            //here save it to user service too.
            deferred.resolve(userId);
            return deferred.promise;
        };

        storageService.getUser = function () {
            if (!!localStorage['userId']) {
                return JSON.parse(localStorage['userId']);
            }
            return null;
        };

        storageService.saveUser = function (profile) {
            var deferred = $q.defer();

            if (!!profile) {
                localStorage['userId'] = JSON.stringify(profile);
            } else {
                localStorage.removeItem('userId');
            }

            deferred.resolve(profile);
            return deferred.promise;
        };
        return storageService;
    });