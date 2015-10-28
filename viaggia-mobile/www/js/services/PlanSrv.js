angular.module('viaggia.services.plan', [])

.factory('planService', function ($q, $http, Config) {

    var planService = {};
    var position = {};
    var planJourneyResults = {};

    var getNameFromComplex = function (data) {
        name = '';
        if (data) {
            if (data.name) {
                name = name + data.name;
            }
            if (data.street && (data.name != data.street)) {
                if (name)
                    name = name + ', ';
                name = name + data.street;
            }
            if (data.housenumber) {
                if (name)
                    name = name + ', ';
                name = name + data.housenumber;
            }
            if (data.city) {
                if (name)
                    name = name + ', ';
                name = name + data.city;
            }
            return name;
        }
    }
    planService.setName = function (place, complexName) {
        if (place == 'from') {
            if (!position.nameFrom) {
                position.nameFrom = '';
            }
            //get name from complexName
            position.nameFrom = getNameFromComplex(complexName);
        } else {
            if (!position.nameTo) {
                position.nameTo = '';
            }
            //get name from complexName
            position.nameTo = getNameFromComplex(complexName);

        }
    }
    planService.getName = function (place) {
        if (place == 'from') {
            return position.nameFrom;
        } else {
            return position.nameFrom;
        }
    }
    planService.setPosition = function (place, latitude, longitude) {
        if (place == 'from') {
            if (!position.positionFrom) {
                position.positionFrom = {};
            }
            position.positionFrom.latitude = latitude;
            position.positionFrom.longitude = longitude;
        } else {
            if (!position.positionTo) {
                position.positionTo = {};
            }
            position.positionTo.latitude = latitude;
            position.positionTo.longitude = longitude;
        }
    }
    planService.getPosition = function (place) {
        if (place == 'from') {
            return position.positionFrom;
        } else {
            return position.positionTo;
        }

    }

    planService.planJourney = function (planConfigure) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: Config.getPlanURL(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                "to": {
                    "lon": planConfigure.to.long,
                    "lat": planConfigure.to.lat
                },
                "routeType": "fastest",
                "resultsNumber": 10,
                "departureTime": planConfigure.departureTime,
                "from": {
                    "lon": planConfigure.from.long,
                    "lat": planConfigure.from.lat
                },
                "date": planConfigure.date,
                "transportTypes": planConfigure.transportTypes
            }
        }).
        success(function (data) {
            deferred.resolve(data);
            planJourneyResults = data;
        }).
        error(function (data, status, headers, config) {
            console.log(data + status + headers + config);
            deferred.reject(data);
        });

        return deferred.promise;
    }
    planService.getplanJourneyResults = function () {
        return planJourneyResults;
    }
    return planService;
})
