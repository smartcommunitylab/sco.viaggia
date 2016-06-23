angular.module('viaggia.controllers.notifications', [])

.controller('NotificationsCtrl', function ($scope, $state, $rootScope, Config, $filter, Toast, notificationService) {

        init();
        $scope.showNotification = function (notification) {

            //add element read in the object
            notification['seen'] = true;
            $state.go('app.notificationdetail', {
                notification: notification
            });
        }

        $scope.isInArray = function (index, notificationId) {
            //            if (index > 9) {
            //                return true;
            //            }
            return $scope.notificationsIsRead.indexOf(notificationId) > -1;
        }



        $scope.loadMore = function () {
            notificationService.getNotifications(0, $scope.start, $scope.all).then(function (notifics) {
                if (notifics) {
                    $scope.notifications = !!$scope.notifications ? $scope.notifications.concat(notifics) : notifics;

                    if ($scope.notifications.length > 0) {
                        lastUpdateTime = $scope.notifications[0].updateTime + 1;
                        localStorage.setItem(Config.getAppId() + '_lastUpdateTime', lastUpdateTime);

                    } else {
                        $scope.emptylist = true;
                    }
                    if (notifics.length >= $scope.all) {
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        $scope.start += $scope.all;
                        $scope.end_reached = false;
                    } else {
                        $scope.end_reached = true;
                    }
                } else {
                    $scope.emptylist = true;
                    $scope.end_reached = true;
                    Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");

                }
                $scope.$broadcast('scroll.refreshComplete');
            }, function (err) {
                console.error(err);
                $scope.$broadcast('scroll.infiniteScrollComplete');
                $scope.$broadcast('scroll.refreshComplete');
                $scope.end_reached = true;
            });
        };

        function containsObject(obj, list) {
            var i;
            for (i = 0; i < list.length; i++) {
                if (list[i].id === obj.id) {
                    return true;
                }
            }
            return false;
        }

        function init() {
            $scope.notificationService = notificationService;
            $scope.emptylist = false;
            //load from localstorage the id notifications read
            $scope.notificationsIsRead = JSON.parse(localStorage.getItem(Config.getAppId() + '_notificationsIsRead')) || [];
            $scope.notifications = JSON.parse(localStorage.getItem(Config.getAppId() + '_notifications')) || [];
            $scope.lastUpdateTime = localStorage.getItem(Config.getAppId() + '_lastUpdateTime');
            //scrico le ultime di una settimana
            if ($scope.lastUpdateTime == null) {
                date = new Date();
                date.setDate(date.getDate() - 7);
                $scope.lastUpdateTime = date.getTime();
            }
            $scope.notifications = [];
            $scope.start = 0;
            $scope.all = 10;
            $scope.end_reached = false;
        }

        $scope.doRefresh = function () {
            init();
            $scope.loadMore();
        }
    })
    .controller('NotificationDetailCtrl', function ($scope, $stateParams, Config, notificationService) {
        $scope.notification = $stateParams.notification;
        //put the id in the list of readed
        var notificationsIsRead = JSON.parse(localStorage.getItem(Config.getAppId() + '_notificationsIsRead')) || [];
        if (notificationsIsRead.indexOf($scope.notification.id) == -1) {
            notificationsIsRead.push($scope.notification.id);
            localStorage.setItem(Config.getAppId() + '_notificationsIsRead', JSON.stringify(notificationsIsRead));
        }
    });
