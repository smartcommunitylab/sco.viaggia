angular.module('viaggia.services.registration', [])

.factory('registrationService', function ($q, $http, $filter, Config, userService) {
    var registrationService = {};

    registrationService.register = function (user) {
        var deferred = $q.defer();
        userService.getValidToken().then(function (validToken) {
            var urlReg = Config.getGamificationURL() + "/out/rest/register?"+
                "nickname=" + user.nickname +
                "&token=" + validToken +
                "&email="+user.mail +
                "&language=" + Config.getLang();
            $http({
                method: 'POST',
                url: urlReg,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    "age_range": user.age_range,
                    "use_transport": user.use_transport,
                    "vehicles": user.vehicles,
                    "averagekm": user.averagekm,
                    "nick_recommandation": user.nick_recommandation
                },
                timeout: 20000
            }).
            success(function (data, status, headers, config) {
                deferred.resolve(data);
            }).
            error(function (data, status, headers, config) {
                console.log(data + status + headers + config);
                deferred.reject(status);
            });

        });


        return deferred.promise;
    }
    return registrationService;
});
