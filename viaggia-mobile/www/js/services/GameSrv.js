angular.module('viaggia.services.game', [])

    .factory('GameSrv', function ($q, $http, $filter, DiaryDbSrv, Config, LoginService) {
        var gameService = {};

        var localStatus = null;
        var localRanking = null;
        var dbFilter = [
            {
                name: 'badge',
                db: ['BADGE']
            },
            {
                name: 'challenge',
                db: ['CHALLENGE']
            },
            {
                name: 'trip',
                db: ['TRAVEL']
            }
            , {
                name: 'raccomandation',
                db: ['RECOMMENDED']
            },
            {
                name: 'allnotifications',
                db: []
            }]

        var tripParams = {
            time:
            function (event) {
                return $filter('date')(event['timestamp'], 'HH:mm')
            },
            travelValidity:
            function (event) {
                return $filter('translate')(event['travelValidity'])
            }
        };
        var NOTIFICATIONS_STYLES = {
            TRAVEL_WALK: {
                string: "msg_trip_walk",
                color: "#60b35c",
                icon: "ic_foot",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_BIKE: {
                string: "msg_trip_bike",
                color: "#922d67",
                icon: "ic_bike",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_BUS: {
                string: "msg_trip_bus",
                color: "#ea8817",
                icon: "ic_urban-bus",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_TRAIN: {
                string: "msg_trip_train",
                color: "#cd251c",
                icon: "ic_train",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_MULTIMODAL: {
                string: "msg_trip_multimodal",
                color: "#2975a7",
                icon: "ic_game_multimodal_trip",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            BADGE: {
                string: "msg_won_badge",
                color: "#60b35c",
                icon: "ic_game_badge",
                params: { 'badgeText': 'badgeText' },
                state: "openBadgeBoard()"
            },
            CHALLENGE: {
                string: "msg_new_challenge",
                color: "#60b35c",
                icon: "ic_game_challenge_assign",
                params: { 'challengeName': 'challengeName' },
                state: "openChallengeBoard(message)"
            },
            CHALLENGE_WON: {
                string: "msg_won_challenge",
                color: "#60b35c",
                icon: "ic_game_challenge",
                params: { 'challengeName': 'challengeName' },
                state: "openChallengeBoard(message)"

            },
            RECOMMENDED: {
                string: "msg_new_friend",
                color: "#3cbacf",
                icon: "ic_game_friend",
                params: { 'recommendedNickname': 'recommendedNickname' },
                state: ""
            },
            NEW_RANKING_WEEK: {
                string: "msg_pub_ranking",
                color: "#3cbacf",
                icon: "ic_game_classification",
                params: {},
                state: "openGamificationBoard()"
            },
        }
        var ERROR_TRIP = {
            NO_DATA: {
                message: "error_trip_no_data"
            },
            OUT_OF_AREA: {
                message: "error_trip_out_of_area"
            },
            TOO_SHORT: {
                message: "error_trip_too_short"
            },
            FREE_TRACKING_NO: {
                message: "error_trip_free_tracking_no"
            },
            PLANNED_NO: {
                message: "error_trip_planned_no"
            },
            VALID_0: {
                message: "error_valid_0"
            }
        }
        var ArrMax = null;

        getTravelType = function (message) {
            var event = JSON.parse(message.event);
            if (event.travelType == 'PLANNED')
                return 'TRAVEL_MULTIMODAL'
            if (event.travelType == 'FREETRACKING')
                return 'TRAVEL_' + event.travelModes[0].toUpperCase()
        }
        createParamString = function (message) {
            var event = JSON.parse(message.event);
            var data = {};
            if (NOTIFICATIONS_STYLES[message.type].params) {
                for (var key in NOTIFICATIONS_STYLES[message.type].params) {
                    var p = NOTIFICATIONS_STYLES[message.type].params[key];
                    if (p) {
                        if (typeof p === 'function') {
                            data[key] = p(event);
                        } else {
                            data[key] = event[p];
                        }
                    }
                }
                return JSON.stringify(data);
            } else {
                return '{}';
            }
            return string;
        }

        var ServerHow = {
            "Daily": "day",
            "Weekly": "week",
            "Monthly": "month",
            "Total": "total",
        }

        gameService.getServerHow = function (how) {
            var filter = how;
            var returnhow = ServerHow[filter];
            return returnhow;
        }
        gameService.getDbType = function (type) {
            for (let i = 0; i < dbFilter.length; i++) {
                if (type == dbFilter[i].name)
                    return dbFilter[i].db[0];
            }
            return [];
        }

        gameService.getStyleColor = function (message) {
            if (message.type == 'TRAVEL') {
                message.type = getTravelType(message)
            }
            return NOTIFICATIONS_STYLES[message.type].color;
        }
        gameService.getIcon = function (message) {
            if (message.type == 'TRAVEL') {
                message.type = getTravelType(message)
            }
            return NOTIFICATIONS_STYLES[message.type].icon;
        }

        gameService.getString = function (message) {
            if (message.type == 'TRAVEL') {
                message.type = getTravelType(message)
            }
            return NOTIFICATIONS_STYLES[message.type].string;
        }
        gameService.getState = function (message) {
            if (message.type == 'TRAVEL') {
                message.type = getTravelType(message)
            }
            return NOTIFICATIONS_STYLES[message.type].state;
        }
        gameService.getParams = function (message) {
            if (message.type == 'TRAVEL') {
                message.type = getTravelType(message)
            }

            return createParamString(message);
        }
        gameService.getNotificationTypes = function (message) {
            if (message.type == 'TRAVEL') {
                message.type = getTravelType(message)
            }
            return NOTIFICATIONS_STYLES[message.type].string;
        }
        gameService.getFilters = function () {
            //to do
        }
        gameService.getDiary = function (type, from, to) {
            var deferred = $q.defer();
            $http.get('data/messages.json').success(function (messages) {
                var returnValue = messages;
                var returnNotifications = [];
                LoginService.getValidAACtoken().then(
                    function (token) {
                        for (var i = returnValue.length - 1; i > 0; i--) {
                            if (returnValue[i].timestamp > from && returnValue[i].timestamp < to)
                                returnNotifications.push(returnValue[i]);
                        }
                        deferred.resolve(returnNotifications);
                    });
            });
            return deferred.promise;
        }
        var checkTravelType = function (travelId) {

            if (travelId.indexOf("walk_") != -1 || travelId.indexOf("bike_") != -1 || travelId.indexOf("bus_") != -1 || travelId.indexOf("train_") != -1) {
                return "FREETRACKING";
            }
            else {
                return "PLANNED"
            }
        }
        var checkTravelModes = function (travelId) {
            var travelModes = [];
            if (travelId.indexOf("walk_") != -1)
                travelModes.push("walk")
            if (travelId.indexOf("bike_") != -1)
                travelModes.push("bike")
            if (travelId.indexOf("train_") != -1)
                travelModes.push("train")
            if (travelId.indexOf("bus_") != -1)
                travelModes.push("bus")


            return travelModes;
        }
        gameService.getEventTripDeatil = function (id) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    $http({
                        method: 'GET',
                        url: Config.getServerURL() + '/gamification/traveldetails/' + id,
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    })
                        .success(function (detail) {
                            deferred.resolve(detail);
                        })

                        .error(function (response) {
                            deferred.reject(response);
                        });
                });
            return deferred.promise;
        }
        gameService.getTravelForDiary = function () {
            var tripId = localStorage.getItem(Config.getAppId() + "_tripId");
            var travelType = checkTravelType(tripId);
            var travelModes = checkTravelModes(tripId);
            return {
                tripId: tripId,
                travelType: travelType,
                travelModes: travelModes
            }
        }
        gameService.getError = function (trip) {
            if (ERROR_TRIP[trip.validationResult.validationStatus.error]) {
                return ERROR_TRIP[trip.validationResult.validationStatus.error].message
            }
            else if (trip.itinerary) {
                //planned
                return ERROR_TRIP["PLANNED_NO"].message
            }
            else {
                //free
                return ERROR_TRIP["FREE_TRACKING_NO"].message
            }

        }
        gameService.addTravelDiary = function (travel) {
            //create event travel after stop with PENDING validity waiting the synch
            if (travel.tripId) {
                var event = {
                    "timestamp": new Date().getTime(),
                    "type": "TRAVEL",
                    "clientId": travel.tripId,
                    "travelType": travel.travelType,
                    "travelModes": travel.travelModes,
                    "travelValidity": "PENDING",
                }
                DiaryDbSrv.addEvent(event);
            }
        }


        gameService.getMaxStat = function (type) {
            if (ArrMax) {
                if (type == "Daily") {
                    return ArrMax.stats.day
                }
                if (type == "Weekly") {
                    return ArrMax.stats.week
                }
                if (type == "Monthly") {
                    return ArrMax.stats.month
                }
                if (type == "Total") {
                    return ArrMax.stats.total
                }
            }
        }
        gameService.getRemoteMaxStat = function () {
            var deferred = $q.defer();
            var MaxStats = []
            LoginService.getValidAACtoken().then(
                function (token) {
                    $http({
                        method: 'GET',
                        url: Config.getServerURL() + '/gamification/statistics/global/player',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    })
                        .success(function (arrMax) {
                            ArrMax = arrMax;
                            deferred.resolve();
                        })

                        // })

                        .error(function (response) {
                            deferred.reject(response);
                        });
                    // deferred.resolve(returnValuee);
                });

            // });
            return deferred.promise;
        }


        //SERVER VERSION
        gameService.getStatistics = function (how, from, to) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    $http({
                        method: 'GET',
                        url: Config.getServerURL() + '/gamification/statistics/player?granularity=' + how + '&from=' + from + '&to=' + to,
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    })
                        .success(function (stats) {
                            deferred.resolve(stats);
                        })

                        .error(function (response) {
                            deferred.reject(response);
                        });
                });
            return deferred.promise;
        }


        /* get remote status */
        gameService.getStatus = function () {
            var deferred = $q.defer();

            LoginService.getValidAACtoken().then(
                function (token) {
                    $http({
                        method: 'GET',
                        url: Config.getGamificationURL() + '/status',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    })
                        .success(function (status) {
                            localStatus = status;
                            deferred.resolve(localStatus);
                        })

                        .error(function (response) {
                            deferred.reject(response);
                        });
                },
                function () {
                    deferred.reject();
                }
            );

            return deferred.promise;
        };

        /* get local status (get remote first if null) */
        gameService.resetLocalStatus = function () {
            localStatus = null;
        }


        /* get local status (get remote first if null) */
        gameService.getLocalStatus = function () {
            var deferred = $q.defer();
            gameService.getStatus().then(
                function (localStatus) {
                    deferred.resolve(localStatus);
                },
                function (response) {
                    deferred.reject(response);
                }
            );
            return deferred.promise;
        };

        /* get ranking */
        gameService.getRanking = function (when, start, end) {
            var deferred = $q.defer();

            LoginService.getValidAACtoken().then(
                function (token) {
                    var timestamp = null;

                    // TODO handle "when"!
                    if (when === 'now') {
                        // Current week
                        var d = new Date();
                        timestamp = d.getTime();
                    } else if (when === 'last') {
                        // Last week
                        var d = new Date();
                        d.setDate(d.getDate() - 7);
                        timestamp = d.getTime();
                    }

                    var config = Config.getHTTPConfig();
                    if (!config.params) {
                        config.params = {};
                    }

                    if ((!!timestamp && timestamp < 0) || (!!start && start < 0) || (!!end && end < 1) || (!!start && !!end && end <= start)) {
                        deferred.reject();
                    }

                    if (!!timestamp) {
                        config.params['timestamp'] = timestamp;
                    }

                    if (!!start) {
                        config.params['start'] = start;
                    }

                    if (!!end) {
                        config.params['end'] = end;
                    }

                    $http({
                        method: 'GET',
                        url: Config.getGamificationURL() + '/classification',
                        params: config.params,
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    })
                        .success(function (ranking) {
                            localRanking = ranking;
                            deferred.resolve(localRanking);
                        })

                        .error(function (response) {
                            deferred.reject(response);
                        });
                },
                function () {
                    deferred.reject();
                }
            );

            return deferred.promise;
        };

        gameService.validUserForGamification = function (profile) {
            var deferred = $q.defer();
            //check if user (profile.userId) is valid or not
            var url = Config.getGamificationURL() + "/checkuser/" + profile.userId;

            $http.get(url).then(
                function (response) {
                    if (!response.data.registered) {
                        deferred.resolve(false);

                    } else {
                        localStorage.userValid = true;
                        deferred.resolve(true);
                    }
                },
                function (responseError) {
                    deferred.reject(responseError);
                }
            );

            return deferred.promise;
        }
        gameService.validUserForGamificationLocal = function () {
            return 'true' == localStorage.userValid;
        }

        return gameService;
    });
