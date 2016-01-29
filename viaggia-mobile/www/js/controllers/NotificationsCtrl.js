angular.module('viaggia.controllers.notifications', [])

.controller('NotificationsCtrl', function ($scope, $state, Toast, $filter, notificationService) {
        $scope.notifications = [];
        $scope.notificationService = notificationService;
        //load from localstorage the id notifications read
        $scope.notificationsIsRead = JSON.parse(localStorage.getItem('notificationsIsRead')) || [];
        $scope.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        $scope.lastUpdateTime = new Date(localStorage.getItem('lastUpdateTime'));
        //scrico le ultime di una settimana
        if ($scope.lastUpdateTime == null) {
            $scope.lastUpdateTime = new Date();
            $scope.lastUpdateTime.setDate($scope.lastUpdateTime.getDate() - 7);
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


        $scope.loadMore = function (state) {

            var length = 0;
            //var length = 1;
            if ($scope.notifications) {
                length = $scope.notifications.length;

            }
            // since last update
            notificationService.getNotifications(0, length).then(function (items) {
                    //da rifare perche' aggiorno con il service
                    if ($scope.notifications) {
                        $scope.emptylist = false;
                        for (var i = 0; i < items.length; i++) {
                            if (!containsObject(items[i], $scope.notifications)) {
                                $scope.notifications.push(items[i]);
                            }
                        }

                        if (items.length < 10) {
                            $scope.noMoreNotificationsAvailable = true;
                        }
                    } else {
                        $scope.notifications = items;
                    }
                    if ($scope.notifications.length == 0) {
                        $scope.emptylist = true;
                    } else {
                        $scope.emptylist = false;
                    }
                    //update date
                    $scope.lastUpdateTime = new Date();
                    //$scope.lastUpdateTime.setHours(0, 0, 0, 0);
                    localStorage.setItem('lastUpdateTime', $scope.lastUpdateTime);
                    localStorage.setItem('notifications', JSON.stringify($scope.notifications));

                    $scope.$broadcast('scroll.infiniteScrollComplete');
                },
                function (reason) {
                    Toast.show($filter('translate')("network_problem"), "short", "bottom");
                    $scope.noMoreNotificationsAvailable = true;
                    $scope.emptylist = true;
                    $scope.$broadcast('scroll.infiniteScrollComplete');

                });
        }

        function containsObject(obj, list) {
            var i;
            for (i = 0; i < list.length; i++) {
                if (list[i].id === obj.id) {
                    return true;
                }
            }
            return false;
        }
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
