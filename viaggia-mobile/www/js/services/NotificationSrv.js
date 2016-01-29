angular.module('viaggia.services.notification', [])


//
//A Service to work with notifications with server
//
.factory('notificationService', function ($q, $http, $rootScope, $ionicPlatform, Config) {

    var notificationService = {};
    var numberNotification = 10;
    notificationService.getNotifications = function (sinceTimestamp, sincePosition) {
        var deferred = $q.defer();
        $http.get(Config.getMessagingServerURL() + '/app/public/notification/' + Config.getMessagingAppId() +
                '/?since=' + sinceTimestamp +
                '&position=' + sincePosition +
                '&count=' + numberNotification, Config.getHTTPConfig())
            .success(function (data) {
                deferred.resolve(data.notifications);
            })
            .error(function (err) {
                deferred.reject(err);

            });
        return deferred.promise;
    }

    // Register to GCM
    notificationService.register = function () {
        console.log("registration xxxxxxxxxxx")
        var push = PushNotification.init({
            android: {
                senderID: Config.getSenderID(),
                topics: [Config.getMessagingAppId()]
            },
            ios: {
                alert: "true",
                badge: "true",
                sound: "true",
                senderID: Config.getSenderID(),
                topics: [Config.getMessagingAppId()]
            },
            windows: {}
        });

        push.on('registration', function (data) {
            //alert('registration' + JSON.stringify(data));
            console.log('registration' + JSON.stringify(data));


        });
        //What to do when I get a notification
        push.on('notification', function (data) {
            //alert("notification" + JSON.stringify(data));
            console.log("notification" + JSON.stringify(data));
            var lastTimeUpdate = new Date(localStorage.getItem('lastUpdateTime'));
            console.log('received');
            $rootScope.countNotification = $rootScope.countNotification + 1;
            //alert("number of notification" + JSON.stringify($rootScope.countNotification));
            updateNotifications(lastTimeUpdate);
        });


        //...and in case of erro
        push.on('error', function (e) {
            //            alert('error' + e.message);
            console.log('error' + e.message)

        });




    }

    var getNotificationDetail = function () {}

    //get the last notification since last update
    var updateNotifications = function (lastTimeUpdate) {
        $http.get(Config.getMessagingServerURL() + '/app/public/notification/' + Config.getMessagingAppId() +
                '/?since=' + lastTimeUpdate.getTime() +
                '&position=' + 0 +
                '&count=' + numberNotification, Config.getHTTPConfig())
            .success(function (data) {
                var lastUpdateTime = new Date();
                localStorage.setItem('lastUpdateTime', lastUpdateTime);
                //update the local notifications and not readed index
                localStorage.setItem('notifications', JSON.stringify(data.notifications));
                console.log('updated');
            })
            .error(function (err) {


            });
    }
    return notificationService;
});
