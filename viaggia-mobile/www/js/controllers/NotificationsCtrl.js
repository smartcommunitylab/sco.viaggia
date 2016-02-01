angular.module('viaggia.controllers.notifications', [])

.controller('NotificationsCtrl', function ($scope, $state, $rootScope, Toast, $filter, notificationService) {
        $scope.notificationService = notificationService;
        //load from localstorage the id notifications read
        $scope.notificationsIsRead = JSON.parse(localStorage.getItem('notificationsIsRead')) || [];
        $scope.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        $scope.lastUpdateTime = localStorage.getItem('lastUpdateTime');
        //scrico le ultime di una settimana
        if ($scope.lastUpdateTime == null) {
            date = new Date();
            date.setDate(date.getDate() - 7);
            $scope.lastUpdateTime = date.getTime();
        }

        $scope.showNotification = function (notification) {

            //add element read in the object
            notification['seen'] = true;
            $state.go('app.notificationdetail', {
                notification: notification
            });
        }

        $scope.isInArray = function (index, notificationId) {
            if (index > 9) {
                return true;
            }
            return $scope.notificationsIsRead.indexOf(notificationId) > -1;
        }

        $scope.notifications = [];
        $scope.start = 0;
        $scope.all = 10;
        $scope.end_reached = false;


        $scope.loadMore = function () {
            notificationService.getNotifications(0, $scope.start).then(function (notifics) {
                $scope.notifications = !!$scope.notifications ? $scope.notifications.concat(notifics) : notifics;
                if ($scope.notifications.length > 0) {
                    lastUpdateTime = $scope.notifications[0].updateTime + 1;
                    localStorage.setItem('lastUpdateTime', lastUpdateTime);

                }
                if (notifics.length >= $scope.all) {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    $scope.start += 1;
                    $scope.end_reached = false;
                } else {
                    $scope.end_reached = true;
                }

            }, function (err) {
                console.error(err);
                $scope.$broadcast('scroll.infiniteScrollComplete');
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

        $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
            $rootScope.previousState = from.name;
            $rootScope.currentState = to.name;
            //tmp workaraound for tabs
            if ($rootScope.currentState == "app.notifications" && $rootScope.previousState != "app.notificationdetail") {
                // $scope.notifications = [];
                $scope.loadMore();
            }
        });
    })
    .controller('NotificationDetailCtrl', function ($scope, $stateParams, notificationService) {
        $scope.notification = $stateParams.notification;
        //put the id in the list of readed
        var notificationsIsRead = JSON.parse(localStorage.getItem('notificationsIsRead')) || [];
        if (notificationsIsRead.indexOf($scope.notification.id) == -1) {
            notificationsIsRead.push($scope.notification.id);
            localStorage.setItem('notificationsIsRead', JSON.stringify(notificationsIsRead));
        }
    });
