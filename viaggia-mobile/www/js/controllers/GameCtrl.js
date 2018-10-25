angular.module('viaggia.controllers.game', [])




    //The main game Menu
    .controller('GameMenuCtrl', function ($scope, $state, $ionicHistory, GameSrv) {
        //$scope.title="Play&Go";
        $scope.init = function () {
            GameSrv.getLocalStatus().then(
                function (status) {
                    $scope.title = status.playerData.nickName
                });
        }
        $scope.init();

        //the back button is managed with this function
        $scope.goHome = function () {
            $state.go('app.home');
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        }

    })


    //Container of the tabs, load data of the game: username, ranking, ...
    .controller('GameCtrl', function ($scope, $rootScope, GameSrv, Config, Toast, $timeout, $filter) {

        $rootScope.currentUser = null;
        $scope.status = null;
        $scope.ranking = null;
        $scope.prize = null;
        $scope.noStatus = false;
        $scope.rankingFilterOptions = ['now', 'last', 'global'];
        $scope.rankingPerPage = 50;

        Config.loading();
        GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                GameSrv.getRanking($scope.rankingFilterOptions[0], 0, $scope.rankingPerPage).then(
                    function (ranking) {
                        $rootScope.currentUser = ranking['actualUser'];
                        $scope.ranking = ranking['classificationList'];
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        $scope.noStatus = false;
                    }
                );
            },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            }
        ).finally(Config.loaded);
    })


    //loads the score tab and all the badges of the user
    .controller('PointsCtrl', function ($scope, $rootScope, Config, profileService, $ionicPopup, $filter) {

        $scope.badges = null;
        $scope.badgeTypes = Config.getBadgeTypes();
        // $rootScope.profileImg = null;


        $scope.changeProfile = function () {
            $ionicPopup.confirm({
                title: $filter('translate')("change_image_title"),
                template: $filter('translate')("change_image_template"),
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                    },
                    {
                        text: $filter('translate')("change_image_confirm"),
                        type: 'button-custom',
                        onTap: function () {
                            $scope.choosePhoto();

                            // document.getElementById('inputImg').click()
                        }
                    }
                ]
            });
        }
        $scope.choosePhoto = function () {
            $scope.chooseAndUploadPhoto($scope.uploadFileImage);
        }

        $scope.getImage = function () {
            if ($scope.$parent.$parent.$parent.status)
                profileService.getProfileImage($scope.$parent.$parent.$parent.status.playerData.playerId).then(function (image) {
                    $rootScope.profileImg = profileService.getAvatarUrl() + $scope.$parent.$parent.$parent.status.playerData.playerId + '/big?' + new Date().getTime();
                    // $scope.refreshProfileImage();
                }, function (error) {
                    $rootScope.profileImg = 'img/game/generic_user.png' + '/big?' + new Date().getTime();
                })
        }

        $scope.$watch('status.badgeCollectionConcept', function (newBadges, oldBadges) {
            var badges = {};
            if (!!$scope.status) {
                angular.forEach($scope.badgeTypes, function (badgeType) {
                    for (var i = 0; i < $scope.status['badgeCollectionConcept'].length; i++) {
                        if ($scope.status['badgeCollectionConcept'][i].name === badgeType) {
                            badges[badgeType] = $scope.status['badgeCollectionConcept'][i]['badgeEarned'];
                        }
                    }
                });
            }
            $scope.badges = badges;
        });
        $scope.$watch('$rootScope.profileImg', function (newBadges, oldBadges) {
            $scope.getImage();
        });
    })



    //loads the challenges tab, manage the filter of past and new challenges

    .controller('ChallengesCtrl', function ($scope, $state, $stateParams, Toast, LoginService, Config, $filter, $ionicScrollDelegate, $ionicPopup, profileService, $window, $timeout, GameSrv) {
        $scope.challenges = null;
        $scope.param = null;
        $scope.tabs = ['past', 'future', 'unlock'];
        $scope.actualTab = "";
        $scope.expansion = [];

        $scope.challenge = [];
        $scope.typeOfChallenges = [];
        $scope.language = null;

        var paramEnd = $stateParams.challengeEnd;
        var paramStart = $stateParams.challengeStart;
        var now = new Date().getTime();



        $scope.openTab = function (tab) {
            // if ($scope.activeTab == 'unlock') {
            $scope.actualTab = tab;
            // }
        }
        $scope.activeTab = function (tab) {
            return (tab == $scope.actualTab);
        }
        $scope.showChallengeInfo = function (challenge) {
            // FIXME temporarly not null
            if (!challenge) {
                challenge = {
                    challCompleteDesc: 'Lorem ipsum dolor sic amet'
                };
            }

            var infoPopup = $ionicPopup.alert({
                title: $filter('translate')('game_tab_challenges_info'),
                subTitle: '',
                cssClass: '',
                template: challenge.challCompleteDesc,
                okText: $filter('translate')('pop_up_close'),
                okType: ''
            });

            infoPopup.then(
                function () { }
            );
        };

        $scope.expand = function (index) {
            $scope.expansion[index] = !$scope.expansion[index];
        }
        $scope.isExpanded = function (index) {
            return $scope.expansion[index]
        }

        $scope.init = function () {
            navigator.globalization.getPreferredLanguage(
                function (result) {
                    $scope.language = result.value.substring(0, 2);
                    GameSrv.getLocalStatus().then(
                        function (status) {
                            $scope.status = status;
                            $scope.noStatus = false;
                            $scope.actualTab = $scope.tabs[0];
                            if (paramEnd && paramEnd > now && paramStart > now) {
                                $scope.actualTab = $scope.tabs[1];
                            }
                            $scope.getTypes();
                            $scope.getActual();
                            $scope.getPast();
                        },
                        function (err) {
                            $scope.noStatus = true;
                            $scope.actualTab = $scope.tabs[0];
                            Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                            $scope.challenges = [];
                            $scope.pastChallenges = [];
                        })

                }, function (err) {

                });

        }
        $scope.getTypes = function () {
            Config.loading();
            if (LoginService.getUserProfile()) {
                GameSrv.getTypesChallenges(LoginService.getUserProfile().userId).then(function (types) {
                    $scope.typeOfChallenges = [];
                    for (var i = 0; i < types.length; i++) {
                        $scope.typeOfChallenges.push({
                            // id: types[i].id,
                            type: types[i].modelName,
                            short: "blabla",
                            long: "blabla long",
                            state: (types[i].state == 'AVAILABLE') ? 1 : 0
                        });
                    }
                }, function (err) {
                    //TODO
                }).finally(Config.loaded);
            }
        }

        var convertChall = function (chall, type) {
            var challConverted = {}
            switch (type) {
                case "racc": {
                    challConverted.challId = chall.challId;
                    challConverted.startDate = chall.startDate;
                    challConverted.endDate = chall.endDate;
                    challConverted.bonus = chall.bonus;
                    challConverted.group = type;
                    challConverted.type = type;
                    challConverted.short = chall.challDesc;
                    challConverted.long = chall.challCompleteDesc;
                }
                case "futu": {
                    challConverted.challId = chall.challId;
                    challConverted.startDate = chall.startDate;
                    challConverted.endDate = chall.endDate;
                    challConverted.bonus = chall.bonus;
                    challConverted.group = type;
                    challConverted.type = type;
                    challConverted.short = chall.challDesc;
                    challConverted.long = chall.challCompleteDesc;
                }
            }
            return challConverted;
        }
        var buildChallenges = function (future, available, invites, sent) {
            $scope.challenges = [];
            if (future) {
                for (var i = 0; i < future.length; i++) {
                    $scope.challenges.push(convertChall(future[i], "futu"));
                }
            }
            //available from raccomandation system
            if (available) {
                for (var i = 0; i < available.length; i++) {
                    $scope.challenges.push(convertChall(available[i], "racc"));
                }
            }
            // var types = [];
            // for (var i = 0; i < $scope.typeOfChallenges.length; i++) {
            //     var item = {
            //         group: "unlock",
            //         type: $scope.typeOfChallenges[i].type,
            //         state: $scope.typeOfChallenges[i].state,
            //         short: $scope.typeOfChallenges[i]["short"],
            //         long: $scope.typeOfChallenges[i]["long"]
            //     }
            //     if ($scope.typeOfChallenges[i].state == 1) {
            //         //unlocked
            //         types.push(item);
            //     } else {
            //         //locked
            //         types.unshift(item);
            //     }
            // }
            // $scope.challenges = $scope.challenges.concat(types);


            //invites from other players
            // for (var i = 0; i < invites.length; i++) {
            //     $scope.challenges.push({
            //         group: "invite",
            //         type: invites[i].type,
            //         received: true,
            //         nickName: invites[i].nicknameSender,
            //         short: invites[i]["short_" + $scope.language],
            //         long: invites[i]["long_" + $scope.language]
            //     });
            // }
            //concateno l'invito se presente
            // if (sent) {
            //     $scope.challenges.push({
            //         group: "invite",
            //         type: sent.type,
            //         received: false,
            //         nickName: sent.nickName,
            //         short: sent["short_" + $scope.language],
            //         long: sent["long_" + $scope.language]
            //     })
            // }
        }
        $scope.showWarning = function (type) {
            if (localStorage.getItem('warning_hide_' + type))
                return false;
            return true;
        }
        $scope.hideWarning = function (type) {
            localStorage.setItem('warning_hide_' + type, true);
        }
        $scope.acceptChallenge = function (challenge) {
            //TODO
            //confirm popup
            $ionicPopup.show({
                title: $filter('translate')("challenge_accept_popup_title"),
                template: $filter('translate')("challenge_accept_popup_template"),
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                    },
                    {
                        text: $filter('translate')("btn_conferma"),
                        type: 'button-custom',
                        onTap: function () {
                            Config.loading();
                            GameSrv.acceptChallenge(challenge).then(function () {
                                //clean list and keep the only one
                                challenge.group = 'futu';
                                $scope.challenges = [challenge];
                                $ionicScrollDelegate.resize();
                            }, function (err) {
                                //TODO err
                            }).finally(Config.loaded);
                        }
                    }

                ]
            });

        }
        $scope.rejectChallenge = function (challenge) {
            //TODO
            Config.loading();
            GameSrv.rejectChallenge(challenge).then(function () {
                //remove it

            }, function (err) {

            }).finally(Config.loaded);
        }
        $scope.configureChallenge = function (challenge) {
            //TODO
            $state.go('app.configureChallenge', { challenge: challenge })
        }


        $scope.getActual = function () {
            //TODO
            var future = []
            var available = []
            var invites = []
            var sent = {}
            Config.loading();
            GameSrv.getFutureChallenges(profileService.status).then(function (challenges) {
                future = challenges

                GameSrv.getAvailableChallenges(profileService.status).then(function (challenges) {
                    available = challenges;

                    GameSrv.getSentInviteChallenges(profileService.status).then(function (challenge) {
                        sent = challenge;
                        GameSrv.getInvitesChallenges(profileService.status).then(function (challenges) {
                            invites = challenges;
                            buildChallenges(future, available, invites, sent);

                        });
                    }), function (err) {
                        $scope.challenges = [];
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");

                    }, function (err) {
                        $scope.challenges = [];
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");

                    }, function (err) {
                        $scope.challenges = [];
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");

                    }
                }).finally(Config.loaded);

            })
        }
        $scope.getChallengeBarTemplate = function (challenge) {
            return GameSrv.getChallengeBarTemplate(challenge);
        }
        $scope.getWidthUser = function (challenge) {
            //TODO
            return "width:" + challenge.status + "%;"
        }
        $scope.getWidthOther = function (challenge) {
            //TODO
            if (challenge.type == 'coop')
                return "width:40%;;"
            return "width:40%;"
        }
        $scope.getWidthSeparator = function (challenge) {
            //TODO
            return "width:30%;background:transparent;"
        }
        $scope.getValueUser = function (challenge) {
            //TODO
            return $filter('translate')('user_chall_status') + challenge.status + "%";
        }
        $scope.getValueOther = function (challenge) {
            //TODO
            return "5 " + $filter('translate')('user_points_label');
        }
        $scope.getPast = function () {
            $scope.pastChallenges = null;
            if (!!$scope.status && !!$scope.status['challengeConcept']) {
                if ($scope.status) {
                    //$scope.pastChallenges = $scope.status['challengeConcept']['oldChallengeData'];
                    GameSrv.getPastChallenges(profileService.status).then(function (pastChallenges) {
                        if (!pastChallenges)
                            $scope.pastChallenges = [];
                        else {
                            $scope.pastChallenges = [];
                            for (var i = 0; i < pastChallenges.length; i++) {
                                $scope.pastChallenges.push({
                                    group: "racc",
                                    type: pastChallenges[i].type,
                                    short: pastChallenges[i].challDesc,
                                    long: pastChallenges[i].challCompleteDesc,
                                    status: pastChallenges[i].status,
                                    idOpponent: pastChallenges[i].idOpponent ? pastChallenges[i].idOpponent : null,
                                    nicknameOpponent: pastChallenges[i].nicknameOpponent ? pastChallenges[i].nicknameOpponent : null,
                                    dataFinished: pastChallenges[i].success ? pastChallenges[i].challCompletedDate : pastChallenges[i].endDate,
                                    success: pastChallenges[i].success
                                });
                            }
                        }
                    }, function (err) {
                        $scope.challenges = [];
                        $scope.pastChallenges = [];
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                    });
                    if (!$scope.pastChallenges) $scope.challenges = [];
                } else {
                    $scope.pastChallenges = null;
                }
            }
        }
        var unlockChallenge = function (type) {
            Config.loading();
            GameSrv.unlockChallenge(type).then(function () {
                //TODO
            }, function (err) {

            }).finally(Config.loaded);;
        }
        $scope.readMore = function (type) {
            $ionicPopup.show({
                title: $filter('translate')("challenge_detail_popup_title"),
                template: type["long"],
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                    }
                ]
            });
        }
        $scope.getIconType = function (type) {
            return GameSrv.getIconType(type);
        }
        $scope.getColorType = function (type) {
            return GameSrv.getColorType(type);
        }
        $scope.getIconChallenge = function (challenge) {
            return GameSrv.getIconChallenge(challenge);
        }


        $scope.getColorChallenge = function (challenge) {
            return GameSrv.getColorChallenge(challenge);
        }
        $scope.getBorderColor = function (challenge) {
            return GameSrv.getBorderColor(challenge);
        }
        $scope.getColorCup = function (challenge) {
            return GameSrv.getColorCup(challenge);
        }
        $scope.unlock = function (type) {
            $ionicPopup.show({
                title: $filter('translate')("challenge_popup_title"),
                template: $filter('translate')("challenge_popup_template_" + type.type),
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                    },
                    {
                        text: $filter('translate')("btn_conferma"),
                        type: 'button-custom',
                        onTap: function () {
                            unlockChallenge(type);
                        }
                    }
                ]
            });
        }
        /* Resize ion-scroll */
        $scope.challengesStyle = {};

        var generateChallengesStyle = function () {
            // header 44, tabs 49, filter 44, listheader 44, my ranking 48
            $scope.challengesStyle = {
                'height': window.innerHeight - (44 + 49 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('challengesScroll').resize();
        };

        generateChallengesStyle();

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateChallengesStyle();
            }, 200);
        };

        $scope.init();


    })
    .controller('ConfigureChallengeCtrl', function ($scope, $state, $filter, $ionicModal, Toast, GameSrv) {
        $scope.players = [];
        $scope.blacklistplayers = [];
        howPlayer = 0; fromPlayer = 0; toPlayer = 0;
        howBlack = 0; fromBlack = 0; toBlack = 0;
        $scope.why = false;
        $scope.playerChoice = null;
        $scope.challenge = {};
        $scope.isChallengeMean = function (mean) {
            return (mean == $scope.challenge.mean);
        }
        $scope.setChallengeMean = function (mean) {
            $scope.challenge.mean = mean;
        }
        $scope.confirmPlayer = function () {
            console.log($scope.challenge.player);
            //TODO update list
            // $scope.challenge.player = $scope.playerChoice;
            $scope.closeList();
        }
        $scope.selectPlayer = function (player) {
            $scope.challenge.player = player;
        }
        $scope.chooseFromList = function () {
            //TODO
            //open modal for choosing the player
            $ionicModal.fromTemplateUrl('templates/game/choosePlayerChallengeModal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
        }
        $scope.closeList = function () {
            $scope.modal.hide();
        }
        $scope.getPlayers = function () {
            //TODO
            Config.loading();
            GameSrv.getPlayersForChallenge(howPlayer, fromPlayer, toPlayer).then(function (players) {
                $scope.players = players;
            }, function (error) {

            }).finally(Config.loaded);;
            GameSrv.getBlacklist(howBlack, fromBlack, toBlack).then(function (players) {
                $scope.blacklistplayers = players;
            }, function (error) {

            });
        }
        $scope.showWhy = function () {
            $scope.why = !$scope.why;
        }
        $scope.calculateTarget = function () {
            //TODO
            if (parametersCorrect()) {
                Config.loading();
                GameSrv.calculateTarget($scope.challenge).then(function (target) {
                    $scope.challenge.target = target;
                }, function (error) {

                }).finally(Config.loaded);;
            } else {
                Toast.show($filter('translate')("toast_error_configure"), "short", "bottom");

            }
        }
        var parametersCorrect = function () {
            //check if there is type and opponent
            if (!$scope.challenge.player)
                return false
            if (!$scope.challenge.mean)
                return false
            return true;
        }
        $scope.requestChallenge = function () {
            //TODO
            Config.loading();
            GameSrv.requestChallenge($scope.challenge).then(function () {
                //send it and go back to list
                $state.go('app.home.challenges')
            }, function (error) {

            }).finally(Config.loaded);

        }
        $scope.removePlayer = function () {
            //TODO
            $scope.challenge.player = null;

        }
        $scope.playerName = null;
        var getNames = function (players) {
            return players.map(function (player) {
                return player.nome;
            })
        }
        var createMapNames = function (players) {
            return players.reduce(function (map, obj) {
                map[obj.nome] = obj;
                return map;
            });
        }
        $scope.typeName = function (typedthings) {
            GameSrv.getPlayersForChallenge(howPlayer, fromPlayer, toPlayer, typedthings).then(function (players) {
                $scope.playersName = getNames(players);
                $scope.mapName = createMapNames(players);
            }, function (err) {

            });
        }
        $scope.changeStringName = function (suggestion) {
            console.log($scope.mapName[suggestion]);
            $scope.selectPlayer($scope.mapName[suggestion]);
        };
    })
    .controller('BlacklistCtrl', function ($scope, $ionicScrollDelegate, $window, $filter, $timeout, Toast, Config, GameSrv) {
        $scope.blacklist = [];
        $scope.noBlack = false;
        $scope.maybeMore = true;
        var getBlacklist = false;
        $scope.status = null;
        $scope.noStatus = false;
        $scope.from = 0
        $scope.to = 10;
        $scope.rankingPerPage = 50;

        var generateRankingStyle = function () {
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('statisticScroll').resize();
        };

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };

        GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                $scope.noStatus = false;
            },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            })


        $scope.removeFromBlacklist = function (id) {
            Config.loading();
            //TODO
            GameSrv.removeFromBlacklist(id).then(function () {
                //removed
                Config.loaded();
            }, function (err) {
                //not removed
                Config.loaded();
            }
            )

        }
        $scope.loadMore = function () {
            if (!getBlacklist) {
                getBlacklist = true;
                Config.loading();
                //TODO manage from and to
                GameSrv.getBlacklist($scope.from, $scope.to).then(
                    function (blacklist) {
                        Config.loaded();
                        $scope.blacklist = $scope.blacklist.concat(blacklist);
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        Config.loaded();
                        getBlacklist = false;
                        if (blacklist.length < $scope.rankingPerPage) {
                            $scope.maybeMore = false;
                        }
                    },
                    function (err) {
                        Config.loaded();
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getBlacklist = false;
                    }
                );
            }
        };
    })




    .controller('DiaryCtrl', function ($scope, $timeout, $state, $filter, GameSrv, $window, $ionicScrollDelegate, DiaryDbSrv, Toast, Config, trackService) {
        $scope.messages = [];
        // $scope.days=[];
        $scope.maybeMore = true;
        var getDiary = false;
        $scope.singleDiaryStatus = true;
        $scope.filter = {
            open: false,
            toggle: function () {
                this.open = !this.open;
                $ionicScrollDelegate.resize();
            },
            filterBy: function (selection) {
                if (this.selected !== selection) {
                    this.selected = selection;
                    this.filter(this.selected);
                }
                this.toggle();
            },
            update: function () {
                this.filter(this.selected);
            },
            filter: function (selection) { },
            options: [],
            selected: null,
        };

        $scope.filter.options = ['allnotifications', 'badge', 'challenge', 'trip', 'raccomandation'];
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;
        $scope.filter.filter = function (selection) {
            Config.loading();
            $scope.maybeMore = true;
            $scope.singleDiaryStatus = true;
            $ionicScrollDelegate.$getByHandle('diaryScroll').scrollTop();
            $scope.init()
            Config.loaded();
        }

        $scope.manageOneEntry = function (notification, multimodal) {
            var time1 = notification.timestamp
            var time2 = $scope.days[$scope.days.length - 1].name
            var msg1 = new Date(time1).setHours(0, 0, 0, 0);
            var msg2 = new Date(time2).setHours(0, 0, 0, 0);
            if (notification.travelValidity == 'PENDING') {
                notification.travelValidity = 'VALID';
                if (notification.event) {
                    var event = JSON.parse(notification.event);
                    event.travelValidity = 'VALID';
                    notification.event = JSON.stringify(event);
                }
            }
            if (multimodal) {
                notification = {
                    event: JSON.stringify(notification),
                    id: notification.clientId,
                    timestamp: notification.timestamp,
                    travelValidity: notification.travelValidity,
                    type: notification.type,
                    multimodal: true,
                    multimodalId: notification.multimodalId
                }
            }
            //se stesso giorno lo metto in coda al blocco altrimenti creo un nuovo giorno
            if (msg1 == msg2) {
                $scope.days[$scope.days.length - 1].messages.push(notification)
            } else {
                $scope.days.push({ name: notification.timestamp, messages: [notification] })
            }
            //se viaggio multimodale e il primo di un nuovo blocco setto parametro first a true in modo da visualizzare la stringa nel diario
            if (multimodal && $scope.days[$scope.days.length - 1].messages && ($scope.days[$scope.days.length - 1].messages.length == 1 || ($scope.days[$scope.days.length - 1].messages[$scope.days[$scope.days.length - 1].messages.length - 1].multimodalId != $scope.days[$scope.days.length - 1].messages[$scope.days[$scope.days.length - 1].messages.length - 2].multimodalId))) {
                $scope.days[$scope.days.length - 1].messages[$scope.days[$scope.days.length - 1].messages.length - 1]["first"] = true;
            }
        }
        $scope.groupDays = function (notifications) {
            if (notifications[0]) {
                if (!$scope.days) {
                    $scope.days = []
                }
                var event = JSON.parse(notifications[0].event);
                if (notifications[0].type == 'TRAVEL' && event.children && event.children.length > 1) {

                    $scope.days.push(
                        {
                            name: notifications[0].timestamp,
                            messages: []
                        })
                    event.children.sort(function (a, b) {
                        return b.timestamp - a.timestamp;
                    });
                    for (var childrenIndex = 0; childrenIndex < event.children.length; childrenIndex++) {
                        $scope.manageOneEntry(event.children[childrenIndex], true)
                    }
                } else {
                    if (notifications[0].travelValidity == 'PENDING') {
                        notifications[0].travelValidity = 'VALID';
                        if (notifications[0].event) {
                            var event = JSON.parse(notifications[0].event);
                            event.travelValidity = 'VALID';
                            notifications[0].event = JSON.stringify(event);
                        }
                    }
                    $scope.days.push(
                        {
                            name: notifications[0].timestamp,
                            messages: [notifications[0]]
                        })
                }
                for (var j = 1; j < notifications.length; j++) {
                    event = JSON.parse(notifications[j].event);
                    if (notifications[j].type == 'TRAVEL' && event.children && event.children.length > 1) {
                        //oder from newest to oldest
                        event.children.sort(function (a, b) {
                            return b.timestamp - a.timestamp;
                        });
                        for (var childrenIndex = 0; childrenIndex < event.children.length; childrenIndex++) {
                            $scope.manageOneEntry(event.children[childrenIndex], true)
                        }
                    }
                    else {
                        $scope.manageOneEntry(notifications[j], false)
                    }
                }
            }
        }
        $scope.isTracking = function (message) {
            if (trackService.isThisTheJourney(message.id)) {
                return true;
            }
            return false;
        }
        $scope.loadMore = function () {
            if (!getDiary && $scope.maybeMore) {
                getDiary = true;
                // console.log("load done")
                if (!$scope.from) {
                    $scope.from = new Date().getTime();
                }
                var temporanea = ($scope.messages != null && $scope.messages.length > 0) ? $scope.messages[$scope.messages.length - 1].timestamp : $scope.from
                var x = temporanea - 2592000000;
                $scope.from = x;
                $scope.to = ($scope.days != null) ? $scope.days[$scope.days.length - 1].messages[$scope.days[$scope.days.length - 1].messages.length - 1].timestamp - 1 : new Date().getTime();
                //bisogna aggiornare scope.to all'ultimo messaggio `
                // if ($scope.messages[0]) {
                // var from = $scope.messages[0].timestamp - 2592000000;
                // var to = $scope.messages[0].timestamp-1;
                var filter = GameSrv.getDbType($scope.filter.selected)
                DiaryDbSrv.readEvents(filter, $scope.from, $scope.to).then(function (notifications) {
                    if (notifications == null || notifications.length == 0) {
                        $scope.maybeMore = false;
                    }
                    $scope.singleDiaryStatus = true;
                    $scope.groupDays(notifications);
                    $scope.messages = notifications;
                    if ($scope.from < Config.getTimeGameLimit()) {
                        $scope.maybeMore = false;
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    $scope.singleDiaryStatus = true;
                    Config.loaded();
                    getDiary = false;
                },
                    function (err) {
                        $scope.maybeMore = false;
                        if (!$scope.message) {
                            $scope.days = [];
                        }
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        $scope.singleDiaryStatus = true;
                        Config.loaded();
                        getDiary = false;
                    });
                // } else {
                //     $scope.$broadcast('scroll.infiniteScrollComplete');
                //     $scope.singleDiaryStatus = true;
                //     Config.loaded();
                //     getDiary = false;
                //     $scope.maybeMore = false;
                // }
                // });

            }
        };
        $scope.noDiary = function () {
            if (!$scope.days) { return false }
            else if ($scope.days.length == 0) {
                return true
            }
            return false

        }
        $scope.getStyleColor = function (message) {
            return GameSrv.getStyleColor(message);
        }
        $scope.getIconColor = function (message) {
            return GameSrv.getIconColor(message);
        }
        $scope.getIcon = function (message) {
            return GameSrv.getIcon(message);
        }
        $scope.getString = function (message) {
            return GameSrv.getString(message);
        }
        $scope.getState = function (message) {
            return GameSrv.getState(message)
        }
        $scope.getParams = function (message) {
            return GameSrv.getParams(message);
        }
        $scope.openEventTripDetail = function (message) {
            // if (JSON.parse(message.event).travelValidity != 'PENDING') {
            $state.go('app.tripDiary', {
                message: message.event
            });
            // }
            // else {
            //     Toast.show($filter('translate')("travel_pending_state"), "short", "bottom");
            // }
        }
        $scope.init = function () {
            if (!getDiary) {
                Config.loading();
                getDiary = true;
                // DiaryDbSrv.dbSetup().then(function () {
                var x = new Date().getTime() - 2592000000;
                var filter = GameSrv.getDbType($scope.filter.selected)
                // DiaryDbSrv.readEvents(filter, 1455800361943, 1476269822849).then(function (notifications) {
                DiaryDbSrv.readEvents(filter, x, new Date().getTime()).then(function (notifications) {
                    if (notifications == null || notifications.length == 0) {
                        $scope.maybeMore = false;
                    }
                    $scope.singleDiaryStatus = true;
                    $scope.days = []
                    $scope.groupDays(notifications)
                    $scope.messages = notifications;
                    getDiary = false;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    Config.loaded();
                }, function (err) {
                    $scope.days = null;
                    $scope.messages = [];
                    Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    getDiary = false;
                    $scope.singleDiaryStatus = false;
                    $scope.maybeMore = false;
                    Config.loaded();
                });
                // })
            }
        }
        Config.loading();
        DiaryDbSrv.dbSetup().then(function () {
            $scope.init();
            Config.loaded();
        }, function (err) {
            Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            Config.loaded();
        })
        /* Resize ion-scroll */
        $scope.rankingStyle = {};

        var generateRankingStyle = function () {
            // header 44, filter 44, 
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('rankingScroll').resize();
        };

        generateRankingStyle();

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };

        $scope.openChallengeBoard = function (message) {
            //$scope.firstOpenPopup.close();
            //get end
            var end = (JSON.parse(message.event)).challengeEnd;
            var start = (JSON.parse(message.event)).challengeStart;
            var now = new Date().getTime();
            if (end > now && start < now) {
                $state.go('app.home.home');
            } else {
                $state.go('app.home.challenges', { challengeEnd: end, challengeStart: start });
            }
        };

    })
    .controller('TripDiaryCtrl', function ($scope, $filter, $timeout, $stateParams, planService, mapService, GameSrv, $window, $ionicScrollDelegate, DiaryDbSrv, Toast, Config) {
        $scope.message = {};
        $scope.trip = {};
        $scope.maxOfMessage = 0;
        $scope.maxvalues = {
            maxDailywalk: 10000,
            maxDailybike: 20000,
            maxDailytransit: 50000,
            maxDailycar: 50000,
            maxWeeklywalk: 70000,
            maxWeeklybike: 140000,
            maxWeeklytransit: 300000,
            maxWeeklycar: 300000,
            maxMonthlywalk: 280000,
            maxMonthlybike: 560000,
            maxMonthlytransit: 1200000,
            maxMonthlycar: 1200000,
            maxTotalwalk: 840000,
            maxTotalbike: 1680000,
            maxTotaltransit: 3600000,
            maxTotalcar: 3600000,
        }
        $scope.$on('$ionicView.beforeEnter', function () {
            mapService.refresh('eventTripMapDetail');
        });


        $scope.initMap = function () {
            mapService.initMap('eventTripMapDetail', false).then(function () {
                console.log('map initialized');
            });
        };
        $scope.$on('$ionicView.afterEnter', function (e) {
            // Prevent destroying of leaflet
            $scope.initMap();
        });
        var fitBounds = function () {
            var boundsArray = [];
            for (var i = 0; i < $scope.pathMarkers.length; i++) {
                var bound = [$scope.pathMarkers[i].lat, $scope.pathMarkers[i].lng];
                boundsArray.push(bound);
            }
            for (var key in $scope.paths) {
                if ($scope.paths[key].latlngs) {
                    var bound = L.polyline($scope.paths[key].latlngs).getBounds();
                    boundsArray.push(bound);
                }
            }

            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('eventTripMapDetail').then(function (map) {
                    map.fitBounds(bounds);
                    Config.loaded();
                }, function (err) {
                    Config.loaded();
                });
            } else {
                Config.loaded();
            }
        }
        $scope.tripIsValid = function () {
            return ($scope.trip.validity != 'INVALID');
        }

        $scope.calculateMaxStats = function (stats) {
            $scope.maxStat = GameSrv.getMaxStat("Daily");
        }
        $scope.getErrorMotivation = function () {
            $scope.errorMotivation = GameSrv.getError($scope.trip);
        }
        function isOnlyByCar(modes) {
            if (modes.length == 1 && modes[0] == 'car') { return true }
            return false
        }
        $scope.isErrorMessagePresent = function () {
            // if (!$scope.tripIsValid()&&($scope.message.travelEstimatedScore==0 && nn in macchina && distanza percorsa >250m: ))
            if (!$scope.tripIsValid() || ($scope.message.travelScore == 0 && !isOnlyByCar($scope.message.travelModes) && $scope.message.travelLength > 250)) {
                $scope.errorMessagePresent = true;
                return true
            }
            $scope.errorMessagePresent = false;
            return false
        }
        $scope.getStyle = function (stat, veichle) {
            //get max of message
            $scope.maxOfMessage = Math.max(($scope.message.travelDistances.transit || 0), ($scope.message.travelDistances.bike || 0), ($scope.message.travelDistances.bus || 0), ($scope.message.travelDistances.train || 0), ($scope.message.travelDistances.walk || 0), ($scope.message.travelDistances.car || 0))
            if (veichle == 'transit') {
                stat = ($scope.message.travelDistances.transit || 0) + ($scope.message.travelDistances.bus || 0) + ($scope.message.travelDistances.train || 0);
                //     $scope.maxStat["max " + veichle] = Math.max(($scope.maxStat["max bus"]||0), ($scope.maxStat["max train"]||0), ($scope.maxStat["max transit"]||0));
            }

            if ($scope.maxStat && (83 * stat) / $scope.maxOfMessage < 8.8 && veichle == 'transit') {
                return "width:" + (8.8) + "%"
            } else if ($scope.maxStat && (83 * stat) / $scope.maxOfMessage < 4.5) {
                return "width:" + (4.5) + "%"
            } else if ($scope.maxStat && $scope.maxOfMessage < $scope.maxvalues["maxDaily" + veichle] && stat < $scope.maxOfMessage) {
                return "width:" + ((78 * stat) / $scope.maxOfMessage) + "%"
            } else {
                return "width:" + (78) + "%"
            }
        }
        $scope.init = function () {
            $scope.message = JSON.parse($stateParams.message);
            $scope.paths = {};
            $scope.pathMarkers = [];
            var currentlyLine = {};
            //get detailt of trip 
            Config.loading();
            GameSrv.getEventTripDeatil($scope.message.entityId).then(function (trip) {
                $scope.trip = trip;
                if ($scope.isErrorMessagePresent()) {
                    $scope.getErrorMotivation();
                }
                GameSrv.getRemoteMaxStat().then(function () {
                    $scope.calculateMaxStats();
                });
                if (trip.itinerary) {
                    //visualize itinerary planned
                    planService.setPlanConfigure(planService.buildConfigureOptions(trip.itinerary));
                    planService.process(trip.itinerary.data, trip.itinerary.originalFrom, trip.itinerary.originalTo);
                    $scope.paths = mapService.getTripPolyline(trip.itinerary.data);
                    $scope.pathMarkers = mapService.getTripPoints(trip.itinerary.data);
                    //visualize itinerary done
                } else {
                    Config.loaded();
                }

                //add real path
                if (trip.geolocationPolyline) {
                    currentlyLine = mapService.decodePolyline(trip.geolocationPolyline);
                }
                $scope.paths["p" + $scope.paths.length] = {
                    color: '#2975a7',
                    weight: 8,
                    latlngs: currentlyLine
                }
                angular.extend($scope, {
                    center: {
                        lat: Config.getMapPosition().lat,
                        lng: Config.getMapPosition().long,
                        zoom: Config.getMapPosition().zoom
                    },
                    markers: $scope.pathMarkers,
                    events: {},
                    paths: $scope.paths
                });
                // fit bounds
                fitBounds();


            }, function (err) {
                Config.loaded();
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");

            });

        }
        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            markers: {},
            events: {},
            paths: {}
        });
        $scope.init();
    }
    )
    .controller('RankingsCtrl', function ($scope, $rootScope, $state, $ionicScrollDelegate, $window, $timeout, Config, GameSrv, Toast, $filter, $ionicPosition) {
        $scope.maybeMore = true;
        $rootScope.currentUser = {};
        $scope.ranking = [];
        $scope.singleRankStatus = true;
        $scope.rank = true;
        $scope.rankingFilterOptions = ['now', 'last', 'global'];
        var getRanking = false;
        $scope.rankingPerPage = 50;

        $scope.filter = {
            open: false,
            toggle: function () {
                this.open = !this.open;
                $ionicScrollDelegate.resize();
            },
            filterBy: function (selection) {
                if (this.selected !== selection) {
                    this.selected = selection;
                    this.filter(this.selected);
                }
                this.toggle();
            },
            update: function () {
                this.filter(this.selected);
            },
            filter: function (selection) { },
            options: [],
            selected: null
        };

        $scope.filter.options = $scope.rankingFilterOptions;
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;

        $scope.filter.filter = function (selection) {
            // reload using new selection
            $scope.rank = true;
            getRanking = true;
            $scope.maybeMore = true;
            $scope.singleRankStatus = true;
            $scope.ranking = [];
            Config.loading();
            GameSrv.getRanking(selection, 0, $scope.rankingPerPage).then(
                function (ranking) {
                    if (ranking) {
                        getRanking = false;
                        $scope.singleRankStatus = true;
                        $rootScope.currentUser = ranking['actualUser'];
                        $scope.ranking = ranking['classificationList'];
                        if (!$scope.ranking || $scope.ranking.length < $scope.rankingPerPage) {
                            $scope.maybeMore = false;
                        }
                        if ($scope.ranking && $scope.ranking.length == 0) {
                            $scope.rank = false;
                        } else {
                            $scope.rank = true;
                        }
                    } else {
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getRanking = false;
                        if ($scope.ranking.length == 0) {
                            $scope.singleRankStatus = false;

                        }
                        //position to the last visible so No infinite scroll
                        if ($scope.ranking.length > 0) {
                            var visualizedElements = Math.ceil((window.innerHeight - (44 + 49 + 44 + 44 + 48)) / 40);
                            var lastelementPosition = $ionicPosition.position(angular.element(document.getElementById('position-' + ($scope.ranking.length - visualizedElements))));
                            $ionicScrollDelegate.scrollTo(lastelementPosition.left, lastelementPosition.top, true);
                        }
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    Config.loaded();
                }, function (err) {
                    Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                    $scope.rank = false;
                    $scope.singleRankStatus = true;
                    Config.loaded();
                }
            )


        };
        $scope.getUserImg = function (id) {
            return Config.getServerURL() + '/gamificationweb/player/avatar/' + Config.getAppId() + '/' + id
        }

        $scope.reloadRank = function () {
            $scope.maybeMore = true;
            $scope.loadMore()
        }
        /* Infinite scrolling */
        $scope.loadMore = function () {
            if (!getRanking && $scope.maybeMore) {
                getRanking = true;
                var start = $scope.ranking != null ? $scope.ranking.length + 1 : 0;
                var end = start + $scope.rankingPerPage;
                GameSrv.getRanking($scope.filter.selected, start, end).then(
                    function (ranking) {
                        if (ranking) {
                            $rootScope.currentUser = ranking['actualUser'];
                            $scope.ranking = $scope.ranking.concat(ranking['classificationList']);

                            if (ranking['classificationList'].length < $scope.rankingPerPage) {
                                $scope.maybeMore = false;
                            }

                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            getRanking = false;
                            $scope.singleRankStatus = true;
                        }
                        else {
                            $scope.maybeMore = false;
                            Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            getRanking = false;
                            if ($scope.ranking && $scope.ranking.length == 0) {
                                $scope.singleRankStatus = false;

                            }
                        }
                    },
                    function (err) {
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getRanking = false;
                        if ($scope.ranking.length == 0) {
                            $scope.singleRankStatus = false;

                        }
                        //position to the last visible so No infinite scroll
                        if ($scope.ranking.length > 0) {
                            var visualizedElements = Math.ceil((window.innerHeight - (44 + 49 + 44 + 44 + 48)) / 40);
                            var lastelementPosition = $ionicPosition.position(angular.element(document.getElementById('position-' + ($scope.ranking.length - visualizedElements))));
                            $ionicScrollDelegate.scrollTo(lastelementPosition.left, lastelementPosition.top, true);
                        }


                    }
                );
            } else {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        };

        /* Resize ion-scroll */
        $scope.rankingStyle = {};

        var generateRankingStyle = function () {
            // header 44, tabs 49, filter 44, listheader 44, my ranking 48
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 49 + 44 + 44 + 48) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('rankingScroll').resize();
        };

        generateRankingStyle();

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };
    });
