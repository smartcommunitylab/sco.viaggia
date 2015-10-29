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
    var ttMap = {
        'WALK': 'ic_mt_foot',
        'BICYCLE': 'ic_mt_bicycle',
        'CAR': 'ic_mt_car',
        'BUS': 'ic_mt_bus',
        'EXTRA': 'ic_mt_extraurbano',
        'TRAIN': 'ic_mt_train',
        'PARK': 'ic_mt_parking',
        'TRANSIT': 'ic_mt_funivia',
        'STREET': 'ic_price_parking'
    };
    var actionMap = {
        'WALK': 'Cammina',
        'BICYCLE': 'Pedala',
        'CAR': 'Guida',
        'BUS': 'Prendi l\'autobus ',
        'TRAIN': 'Prendi il treno '
    };

    var getImageName = function (tt, agency) {
        if (tt == 'BUS' && Config.getExtraurbanAgencies().indexOf(agency) >= 0) {
            return ttMap['EXTRA'];
        }
        return ttMap[tt];
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
    planService.getLength = function (it) {
        if (!it.leg && it.length) {
            return (it.length / 1000).toFixed(2);
        }
        var l = 0;
        for (var i = 0; i < it.leg.length; i++) {
            l += it.leg[i].length;
        }
        return (l / 1000).toFixed(2);
    };
    planService.extractItineraryMeans = function (it) {
        var means = [];
        var meanTypes = [];
        for (var i = 0; i < it.leg.length; i++) {
            var t = it.leg[i].transport.type;
            var elem = {
                note: [],
                img: null
            };
            elem.img = getImageName(t, it.leg[i].transport.agencyId);
            if (!elem.img) {
                console.log('UNDEFINED: ' + it.leg[i].transport.type);
                elem.img = getImageName('BUS');
            }
            elem.img = 'img/' + elem.img + '.png';

            if (t == 'BUS' || t == 'TRAIN') {
                elem.note = [it.leg[i].transport.routeShortName];
            } else if (t == 'CAR') {
                if (meanTypes.indexOf('CAR') < 0) {
                    var parking = extractParking(it.leg[i], false);
                    if (parking) {
                        if (parking.type == 'STREET') {
                            elem.note = parking.note;
                        } else {
                            means.push(elem);
                            elem = {
                                img: parking.img,
                                note: parking.note
                            };
                        }
                    }
                }
            }

            var newMt = t + (elem.note.length > 0 ? elem.note.join(',') : '');
            if (meanTypes.indexOf(newMt) >= 0) continue;
            meanTypes.push(newMt);
            means.push(elem);
        }
        return means;
    };
    planService.process = function (plan, from, to, useCoordinates) {
        plan.steps = [];
        var nextFrom = !useCoordinates ? from : nextFrom = plan.leg[0].from.name + ' (' + plan.leg[0].from.lat + ',' + plan.leg[0].from.lon + ')';

        for (var i = 0; i < plan.leg.length; i++) {
            var step = {};
            step.startime = i == 0 ? plan.startime : plan.leg[i].startime;
            step.endtime = plan.leg[i].endtime;
            step.mean = {};

            extractDetails(step, plan.leg[i], i, nextFrom);
            nextFrom = null;
            step.length = getLength(plan.leg[i]);
            step.cost = getLegCost(plan, i);

            var t = plan.leg[i].transport.type;
            step.mean.img = getImageName(t, plan.leg[i].transport.agencyId);
            if (!step.mean.img) {
                console.log('UNDEFINED: ' + plan.leg[i].transport.type);
                step.mean.img = getImageName('BUS');
            }
            step.mean.img = 'www/img/' + step.mean.img + '.png';

            var parkingStep = null;
            if (t == 'CAR') {
                var parking = extractParking(plan.leg[i], true);
                if (parking) {
                    if (parking.type == 'PARK') {
                        step.to = 'parcheggio ' + parking.place;
                        nextFrom = step.to;
                        parkingStep = {
                            startime: plan.leg[i].endtime,
                            endtime: plan.leg[i].endtime,
                            action: 'Lascia la macchina a ',
                            actionDetails: step.to,
                            parking: parking,
                            mean: {
                                img: parking.img
                            }
                        };
                    } else {
                        step.parking = parking;
                    }
                }
            }
            if (useCoordinates && i == plan.leg.length - 1) step.to += ' (' + plan.leg[i].to.lat + ',' + plan.leg[i].to.lon + ')';
            plan.steps.push(step);
            if (parkingStep != null) {
                plan.steps.push(parkingStep);
            }
        }
    };
    planService.getItineraryCost = function (plan) {
        var fareMap = {};
        var total = 0;
        for (var i = 0; i < plan.leg.length; i++) {
            if (plan.leg[i].extra) {
                var fare = plan.leg[i].extra.fare;
                var fareIdx = plan.leg[i].extra.fareIndex;
                if (fare && fareMap[fareIdx] == null) {
                    fareMap[fareIdx] = fare;
                    total += fare.cents / 100;
                }
            }
        }
        return total;
    };
    planService.getLegCost = function (plan, i) {
        var fareMap = {};
        var total = 0;
        if (plan.leg[i].extra) {
            var fare = plan.leg[i].extra.fare;
            var fareIdx = plan.leg[i].extra.fareIndex;
            if (fare && fareMap[fareIdx] == null) {
                fareMap[fareIdx] = fare;
                total += fare.cents / 100;
            }
        }
        return total;
    };
    planService.planJourney = function (planConfigure) {
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: Config.getServerURL()+'/plansinglejourney ',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                "to": {
                    "lon": planConfigure.to.long,
                    "lat": planConfigure.to.lat
                },
                "routeType": planConfigure.routeType,
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
