angular.module('viaggia.controllers.notifications', [])

.controller('NotificationsCtrl', function ($scope, $state, $rootScope, Config, $filter, Toast, notificationService) {


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
