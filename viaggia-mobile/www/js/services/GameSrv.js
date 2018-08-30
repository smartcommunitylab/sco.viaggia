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
                },
            points:
                function (event) {
                    return event['travelScore']
                }
        };
        var NOTIFICATIONS_STYLES = {
            TRAVEL_WALK: {
                string: "msg_trip_walk",
                color: "#25BC5D",
                iconColor: "#008431",
                icon: "ic_foot",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_BIKE: {
                string: "msg_trip_bike",
                color: "#B44395",
                iconColor: "#6C024F",
                icon: "ic_bike",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_BUS: {
                string: "msg_trip_bus",
                color: "#FF9D33",
                iconColor: "#B65F00",
                icon: "ic_urban-bus",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_TRAIN: {
                string: "msg_trip_train",
                color: "#FF9D33",
                iconColor: "#B65F00",
                icon: "ic_train",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_MULTIMODAL: {
                string: "msg_trip_multimodal",
                color: "#2681A4",
                iconColor: "#055472",
                icon: "ic_game_multimodal_trip",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            TRAVEL_TRANSIT: {
                string: "msg_trip_multimodal",
                color: "#FF9D33",
                iconColor: "#B65F00",
                icon: "ic_game_multimodal_trip",
                params: tripParams,
                state: "openEventTripDetail(message)"
            },
            BADGE: {
                string: "msg_won_badge",
                color: "#25BC5D",
                iconColor: "#008431",
                icon: "ic_game_badge",
                params: { 'badgeText': 'badgeText' },
                state: "openBadgeBoard()"
            },
            CHALLENGE: {
                string: "msg_new_challenge",
                color: "#e54d2d",
                iconColor: "#B62000",

                icon: "ic_game_challenge_assign",
                params: { 'challengeName': 'challengeName' },
                state: "openChallengeBoard(message)"
            },
            CHALLENGE_WON: {
                string: "msg_won_challenge",
                color: "#e54d2d",
                iconColor: "#B62000",

                icon: "ic_game_challenge",
                params: { 'challengeName': 'challengeName' },
                state: "openChallengeBoard(message)"

            },
            RECOMMENDED: {
                string: "msg_new_friend",
                color: "#2681A4",
                iconColor: "#055472",
                icon: "ic_game_friend",
                params: { 'recommendedNickname': 'recommendedNickname' },
                state: ""
            },
            NEW_RANKING_WEEK: {
                string: "msg_pub_ranking",
                color: "#2681A4",
                iconColor: "#055472",
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
        var iconChall = {
            comp_time: 'ic_ch_tempo',
            comp_perf: 'ic_ch_perf',
            coop: 'ic_ch_coop',
            single: 'ic_ch_single',
            sent_coop: 'ic_ch_coop_invitation',
            sent_comp_perf: 'ic_ch_perf_invitation',
            sent_comp_time: 'ic_ch_tempo_inv'
        }
        var colorChall = {
            comp_time: 'time-user time-other-color',
            comp_perf: 'perf-user perf-other-color',
            coop: 'coop-user coop-other-color',
            single: 'single-user single-other-color',
            sent_coop: 'coop-other-color',
            sent_comp_perf: 'perf-other-color',
            sent_comp_time: ' time-other-color'
        }

        var color = {
            comp_time: '#25BC5D;',
            comp_perf: '#FF9D33;',
            coop: '#e54d2d;',
            racc: '#2681A4;',
        }
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
            if (NOTIFICATIONS_STYLES[message.type] && NOTIFICATIONS_STYLES[message.type].params) {
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
            for (var i = 0; i < dbFilter.length; i++) {
                if (type == dbFilter[i].name)
                    return dbFilter[i].db[0];
            }
            return [];
        }

        gameService.getStyleColor = function (message) {
            if (message) {


                if (!message.type) {
                    return NOTIFICATIONS_STYLES['TRAVEL_MULTIMODAL'].color
                }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }
                return NOTIFICATIONS_STYLES[message.type].color;
            }
        }
        gameService.getIconColor = function (message) {
            if (message) {


                if (!message.type) {
                    return NOTIFICATIONS_STYLES['TRAVEL_MULTIMODAL'].iconColor
                }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }
                return NOTIFICATIONS_STYLES[message.type].iconColor;
            }
        }
        gameService.getIcon = function (message) {
            if (message) {


                if (!message.type) {
                    return NOTIFICATIONS_STYLES['TRAVEL_MULTIMODAL'].icon
                }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }
                return NOTIFICATIONS_STYLES[message.type].icon;
            }
        }

        gameService.getString = function (message) {
            if (message) {

                if (!message.type) {
                    return NOTIFICATIONS_STYLES['TRAVEL_MULTIMODAL'].string
                }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }
                return NOTIFICATIONS_STYLES[message.type].string;
            }
        }

        gameService.getState = function (message) {
            if (message) {

                if (!message.type) {
                    return NOTIFICATIONS_STYLES['TRAVEL_MULTIMODAL'].state
                }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }
                return NOTIFICATIONS_STYLES[message.type].state;
            }
        }

        gameService.getParams = function (message) {
            if (message) {


                // if (!message.type) {
                //     return message.type
                // }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }

                return createParamString(message);
            }
        }

        gameService.getNotificationTypes = function (message) {
            if (message) {

                if (!message.type) {
                    return NOTIFICATIONS_STYLES['TRAVEL_MULTIMODAL'].string
                }
                if (message.type == 'TRAVEL') {
                    message.type = getTravelType(message)
                }
                return NOTIFICATIONS_STYLES[message.type].string;
            }
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
            //if multimodal use dbid
            if (localStorage.getItem(Config.getAppId() + "_dbId")) {
                tripId = localStorage.getItem(Config.getAppId() + "_dbId");
            }
            if (tripId) {
                var travelType = checkTravelType(tripId);
                var travelModes = checkTravelModes(tripId);
                return {
                    tripId: tripId,
                    travelType: travelType,
                    travelModes: travelModes
                }
            } else return null
        }
        gameService.getError = function (trip) {
            if (trip && trip.validationResult) {
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


        //TODO mandare un default
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

        gameService.getPastChallenges = function (profile) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve([{
                        id: 0,
                        type: "comp_time",
                        short_it: 'Sfida competitiva a tempo',
                        short_en: 'Sfida competitiva a tempo',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        idOpponent: 0,
                        nicknameOpponent: "ciccio",
                        dataFinished: 1517529600000,
                        target: 100,
                        win: 0,
                        value: {
                            unit: "km",  //km or greenleaves or whatever
                            player: 50,
                            opponent: 60
                        }

                    }, {
                        id: 1,
                        type: "comp_perf",
                        short_it: 'Sfida competitiva performance',
                        short_en: 'Sfida competitiva performance',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        idOpponent: 0,
                        nicknameOpponent: "tizio",
                        dataFinished: 1517529600000,
                        target: null,
                        win: 1,
                        value: {
                            unit: "km",  //km or greenleaves or whatever
                            player: 80,
                            opponent: 60
                        }
                    }, {
                        id: 2,
                        type: "coop",
                        short_it: 'Sfida cooperativa',
                        short_en: 'Sfida cooperativa',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        idOpponent: 0,
                        nicknameOpponent: "ciccio",
                        dataFinished: 1517529600000,
                        target: 200,
                        win: 0,
                        value: {
                            unit: "km",  //km or greenleaves or whatever
                            player: 70,
                            opponent: 80
                        }
                    }, {
                        id: 3,
                        type: "coop",
                        short_it: 'Sfida cooperativa',
                        short_en: 'Sfida cooperativa',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        idOpponent: 0,
                        nicknameOpponent: "ciccio",
                        dataFinished: 1517529600000,
                        target: 200,
                        win: 0,
                        value: {
                            unit: "km",  //km or greenleaves or whatever
                            player: 50,
                            opponent: 60
                        }
                    }, {
                        id: 4,
                        type: "racc",
                        short_it: 'Sfida singola',
                        short_en: 'Sfida singola',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        dataFinished: 1517529600000,
                        target: 50,
                        win: 1,
                        value: {
                            unit: "km",  //km or greenleaves or whatever
                            player: 50
                        }
                    }, {
                        id: 5,
                        type: "coop",
                        short_it: 'Sfida cooperativa',
                        short_en: 'Sfida cooperativa',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        idOpponent: 0,
                        nicknameOpponent: "ciccio",
                        dataFinished: 1517529600000,
                        target: 80,

                        win: 1,
                        value: {
                            unit: "km",  //km or greenleaves or whatever
                            player: 80,
                            opponent: 60
                        }
                    }]);
                });
            return deferred.promise;
        }
        gameService.getTypesChallenges = function (profile) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve([{
                        id: 0,
                        type: "comp_time",
                        short_it: 'Sfida competitiva a tempo',
                        short_en: 'Sfida competitiva a tempo',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        state: 0
                    }, {
                        id: 1,
                        type: "comp_perf",
                        short_it: 'Sfida competitiva performance',
                        short_en: 'Sfida competitiva performance',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        state: 1
                    }, {
                        id: 2,
                        type: "coop",
                        short_it: 'Sfida cooperativa',
                        short_en: 'Sfida cooperativa',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        state: 0
                    }]);
                });
            return deferred.promise;
        }
        gameService.getAvailableChallenges = function (profile) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve([{
                        id: 0,
                        type: "single",
                        short_it: 'Sfida competitiva a tempo',
                        short_en: 'Sfida competitiva a tempo',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    }, {
                        id: 1,
                        type: "comp_perf",
                        short_it: 'Sfida competitiva performance',
                        short_en: 'Sfida competitiva performance',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    }, {
                        id: 2,
                        type: "coop",
                        short_it: 'Sfida cooperativa',
                        short_en: 'Sfida cooperativa',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    }]);
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }

        gameService.getInvitesChallenges = function (profile) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve([{
                        id: 0,
                        idSender: 0,
                        nicknameSender: "pippo",
                        idReceiver: 0,
                        nickname: "pippo",
                        type: "coop",
                        short_it: 'Sfida competitiva a tempo',
                        short_eng: 'Sfida competitiva a tempo',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    }, {
                        id: 1,
                        idSender: 0,
                        nicknameSender: "pippo",
                        idReceiver: 0,
                        nickname: "pippo",
                        type: "comp_perf",
                        short_it: 'Sfida competitiva performance',
                        short_eng: 'Sfida competitiva performance',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    }, {
                        id: 2,
                        idUser: 0,
                        idSender: 0,
                        nicknameSender: "pippo",
                        idReceiver: 0,
                        nickname: "pippo",
                        type: "comp_time",
                        short_it: 'Sfida cooperativa',
                        short_eng: 'Sfida cooperativa',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    }]);
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }
        gameService.getSentInviteChallenges = function (profile) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve({
                        id: 0,
                        idSender: 0,
                        nicknameSender: "pippo",
                        idReceiver: 0,
                        nickName: "pippo",
                        type: "coop",
                        short_it: 'Sfida competitiva a tempo',
                        short_eng: 'Sfida competitiva a tempo',
                        long_it: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                        long_en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pellentesque sapien nulla. Cras in libero vehicula, dapibus sem ac, facilisis tortor. Cras sed fringilla libero, eu euismod mi. Integer non mi dapibus nunc convallis tempor. Morbi eget risus luctus, dapibus orci nec, vulputate diam. Pellentesque molestie nibh at sapien iaculis ultrices. Fusce quis libero sed turpis scelerisque semper. Morbi suscipit nisl nunc, a blandit elit egestas non. Vivamus posuere sem id pellentesque fringilla. Proin sit amet ante id elit vestibulum vehicula eget ut risus. Maecenas vulputate ipsum in ligula dapibus ultricies. ',
                    });
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }
        gameService.removeSentInviteChallenges = function (profile) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve();
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }
        gameService.unlockChallenge = function (type) {
            //TODO
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }
        gameService.removeFromBlacklist = function (id) {
            //TODO
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }

        gameService.addToBlacklist = function (id) {
            //TODO
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }
        gameService.acceptChallenge = function () {
            //TODO
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }
        gameService.getBlacklist = function (how, from, to) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve([{
                        id: 0,
                        nome: 'Tizio'
                    }, {
                        id: 1,
                        nome: 'Caio'
                    }, {
                        id: 2,
                        nome: 'Sempronio'
                    }, {
                        id: 3,
                        nome: 'Marco'
                    }]);
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }
        gameService.getPlayersForChallenge = function (how, from, to, typedthings) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve([{
                        id: 0,
                        nome: 'Tizio'
                    }, {
                        id: 1,
                        nome: 'Caio'
                    }, {
                        id: 2,
                        nome: 'Sempronio'
                    }, {
                        id: 3,
                        nome: 'Marco'
                    }]);
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }
        gameService.calculateTarget = function (challenge) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve({
                        target: "20 Km bici",
                        leavesPlayer: 100,
                        leavesOpponent: 100,
                    });
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }
        gameService.requestChallenge = function (challenge) {
            var deferred = $q.defer();
            LoginService.getValidAACtoken().then(
                function (token) {
                    //TODO
                    deferred.resolve();
                    // $http({
                    //     method: 'GET',
                    //     url: Config.getServerURL() + '/gamification/blacklist?from=' + from + '&to=' + to,
                    //     headers: {
                    //         'Authorization': 'Bearer ' + token,
                    //         'appId': Config.getAppId(),
                    //     },
                    //     timeout: Config.getHTTPConfig().timeout
                    // })
                    //     .success(function (stats) {
                    //         deferred.resolve(stats);
                    //     })

                    //     .error(function (response) {
                    //         deferred.reject(response);
                    //     });
                });
            return deferred.promise;
        }

        //Style functionalities for challenges

        gameService.getIconType = function (type) {
            return iconChall[type.type];
        }
        gameService.getColorType = function (type) {
            return colorChall[type.type];
        }
        gameService.getIconChallenge = function (challenge) {
            if (challenge.group == 'invite')
                return iconChall['sent_' + challenge.type];
            return iconChall[challenge.type];
        }

        gameService.getColorChallenge = function (challenge) {
            if (challenge.group == 'invite')
                return colorChall['sent_' + challenge.type];
            return colorChall[challenge.type];
        }
        gameService.getBorderColor = function (challenge) {
            return "border-left: solid 16px " + color[challenge.type];
        }
        gameService.getColorCup = function (challenge) {
            return "color:" + color[challenge.type];
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
        gameService.getProfileOther = function (profileId) {
            var deferred = $q.defer();
            //check if user (profile.userId) is valid or not
            LoginService.getValidAACtoken().then(
                function (token) {
                    $http({
                        method: 'GET',
                        url: Config.getGamificationURL() + "/status/other/" + profileId,
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    }).then(
                        function (response) {
                            deferred.resolve(response.data);
                        },
                        function (responseError) {
                            deferred.reject(responseError);
                        }
                    );
                })
            return deferred.promise;
        }
        return gameService;
    });
