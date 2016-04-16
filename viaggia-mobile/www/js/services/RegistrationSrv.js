angular.module('viaggia.services.registration', [])

.factory('registrationService', function ($q, $http, $filter, Config, userService) {
    var registrationService = {};

    registrationService.register = function (user) {
        var deferred = $q.defer();
        userService.getValidToken().then(function (validToken) {
            var urlReg = Config.getGamificationURL() + "/out/rest/register?nickname=" + user.nickname + "&token=" + validToken;
            $http({
                method: 'POST',
                url: urlReg,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    "age_range": user.age_range, // "0-20" o "20-40" o "40-70" o "70-100"
                    "use_transport": user.use_transport,
                    "vehicles": user.vehicles, //"train", "bus", "shared car", "shared bike", "private car", "private bike", "walk" dove ultimi 3 solo nell caso di user_transport false
                    "averagekm": user.averagekm,
                    "nick_recommandation": user.nick_recommandation
                },
                timeout: 10000
            }).
            success(function (data, status, headers, config) {
                deferred.resolve(data);
            }).
            error(function (data, status, headers, config) {
                console.log(data + status + headers + config);
                deferred.reject(data);
            });

        });


        return deferred.promise;
    }
    return registrationService;
});
