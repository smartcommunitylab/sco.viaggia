angular.module('viaggia.services.plan', [])

.factory('planService', function ($q, $http, $filter, Config) {

    var planService = {};
    var position = {};
    var planJourneyResults = {};
    var planConfigure = {};
    var selectedjourney = {};
    var geoCoderPlaces = {};
    var fromOrTo = "";
    var tripId = null;
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

    //    };
    var actionMap = function (action) {
        switch (action) {
        case 'WALK':
            return $filter('translate')('action_walk');
        case 'BICYCLE':
            return $filter('translate')('action_bicycle');
        case 'CAR':
            return $filter('translate')('action_car');
        case 'BUS':
            return $filter('translate')('action_bus');
        case 'TRAIN':
            return $filter('translate')('action_train');
        case 'PARKWALK':
            return $filter('translate')('action_walk');
        default:
            return $filter('translate')('action_walk');
        }
    }
    var getImageName = function (tt, agency) {
        if (tt == 'BUS' && Config.getExtraurbanAgencies() && Config.getExtraurbanAgencies().indexOf(parseInt(agency)) >= 0) {
            return ttMap['EXTRA'];
        }
        if (tt == 'PARKWALK') {
            return ttMap['WALK'];
        }

        return ttMap[tt];
    }
    planService.setFromOrTo = function (value) {
        fromOrTo = value;
    }
    planService.getFromOrTo = function () {
        return fromOrTo;
    }
    planService.setTripId = function (id) {
        tripId = id;
    }
    planService.getTripId = function () {
        return tripId;
    }
    planService.setName = function (place, complexName) {
        if (place == 'from') {
            if (!position.nameFrom) {
                position.nameFrom = '';
            }
            if (typeof complexName === 'string' || complexName instanceof String) {
                position.nameFrom = complexName;
            } else { //get name from complexName
                position.nameFrom = getNameFromComplex(complexName);
            }
        } else {
            if (!position.nameTo) {
                position.nameTo = '';
            }
            if (typeof complexName === 'string' || complexName instanceof String) {
                position.nameTo = complexName;
            } else {
                //get name from complexName
                position.nameTo = getNameFromComplex(complexName);
            }
        }
    }
    planService.getName = function (place) {
        if (place == 'from') {
            return position.nameFrom;
        } else {
            return position.nameTo;
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
    var extractParking = function (leg, extended) {
        var res = {
            type: null,
            cost: null,
            time: null,
            note: [],
            img: null
        };
        if (leg.extra != null) {
            if (leg.extra.costData && leg.extra.costData.fixedCost) {
                var cost = (leg.extra.costData.fixedCost).replace(',', '.').replace(' ', '');
                if (extended == true) {
                    cost = parseFloat(cost) > 0 ? leg.extra.costData.costDefinition : 'gratis';
                } else {
                    cost = parseFloat(cost) > 0 ? ($filter('number')(cost, 2) + '\u20AC') : 'gratis';
                }
                res.cost = cost;
                res.note.push(cost);
            }
            if (leg.extra.searchTime && leg.extra.searchTime.max > 0) {
                res.time = leg.extra.searchTime.min + '-' + leg.extra.searchTime.max + 'min';
                res.note.push(res.time);
            }
            res.type = 'STREET';
        }
        if (leg.to.stopId) {
            var cost = 'gratis';
            if (leg.to.stopId.extra && leg.to.stopId.extra.costData && leg.to.stopId.extra.costData.fixedCost) {
                cost = (leg.to.stopId.extra.costData.fixedCost).replace(',', '.').replace(' ', '');
                if (extended == true) {
                    cost = parseFloat(cost) > 0 ? leg.to.stopId.extra.costData.costDefinition : 'gratis';
                } else {
                    cost = parseFloat(cost) > 0 ? ($filter('number')(cost, 2) + '\u20AC') : 'gratis';
                }
            }
            res.cost = cost;
            res.note.push(cost);
            res.type = 'PARK';
        }
        if (leg.to.stopId && leg.to.stopId.id) {
            //            var parkingPlace = parking.getParking(leg.to.stopId.agencyId, leg.to.stopId.id);
            var parkingPlace = null;
            res.place = parkingPlace != null ? parkingPlace.description : leg.to.stopId.id;
        }
        if (res.type) {
            res.img = 'img/' + getImageName(res.type) + '.png';
            return res;
        }
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
    var getLength = function (it) {
        if (!it.leg && it.length) {
            return (it.length / 1000).toFixed(2);
        }
        return 0;
//        var l = 0;
//        for (var i = 0; i < it.leg.length; i++) {
//            l += it.leg[i].length;
//        }
//        return (l / 1000).toFixed(2);
    };
    var getLegCost = function (plan, i) {
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

    planService.getTimeStr = function (time) {
        return (time.getHours() < 10 ? '0' : '') + time.getHours() + ':' + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
    };

    var extractDetails = function (step, leg, legs, idx, from) {
        step.action = actionMap(leg.transport.type);
        if (leg.transport.type == 'BICYCLE' && leg.transport.agencyId && leg.transport.agencyId != 'null') {
            step.fromLabel = $filter('translate')('journey_details_from_bike');
            if (leg.to.stopId && leg.to.stopId.agencyId && leg.to.stopId.agencyId != 'null') {
                step.toLabel = $filter('translate')('journey_details_to_bike');
            } else {
                step.toLabel = $filter('translate')('plan_to');
            }
            //    	} else if (leg.transport.type == 'CAR' && leg.transport.agencyId && leg.transport.agencyId != 'null') {
        } else {
            step.fromLabel = $filter('translate')('journey_details_from');
            step.toLabel = $filter('translate')('journey_details_to');
        }
        if (leg.transport.type == 'BUS' || leg.transport.type == 'TRAIN' || leg.transport.type == 'TRANSIT') {
            step.actionDetails = leg.transport.routeShortName;
        }

        if (planConfigure) {
            step.from = buildDescriptionFrom(planConfigure.from.name, legs, idx);
        } else {
            step.from = buildDescriptionFrom(position.fromName, legs, idx);
        }
        if (planConfigure) {
            step.to = buildDescriptionTo(planConfigure.to.name, legs, idx);
        } else {
            step.to = buildDescriptionTo(position.toName, legs, idx);
        }



    };

    var isBadString = function (s) {
        if (s.indexOf("road") > -1 || s.indexOf("sidewalk") > -1 || s.indexOf("path") > -1 || s.indexOf("steps") > -1 || s.indexOf("track") > -1 || s.indexOf("node ") > -1 || s.indexOf("way ") > -1) {
            return true;
        }
        return false;
    }

    var buildDescriptionFrom = function (fromPosition, legs, idx) {
        var from = "";
        if (idx == 0) {
            from = " " + (fromPosition);
        } else if (legs[idx - 1] == null || isBadString(legs[idx - 1].to.name)) {
            from = $filter('translate')('action_move');
        } else {
            from = " " + placeName(legs[idx - 1].to.name);
        }
        return from;
    }

    var placeName = function (p) {
        return p;
    }

    var buildDescriptionTo = function (toPosition, legs, idx) {
        var to = "";
        if ((idx + 1 == legs.length)) {
            to = " " + (toPosition);
        } else if (legs[idx + 1] == null || isBadString(legs[idx + 1].from.name)) {
            to = $filter('translate')('action_move');
        } else {
            to = " " + placeName(legs[idx + 1].from.name);
        }
        return to;
    }



    planService.process = function (plan, from, to, useCoordinates) {
        plan.steps = [];
        var nextFrom = !useCoordinates ? from : nextFrom = plan.leg[0].from.name + ' (' + plan.leg[0].from.lat + ',' + plan.leg[0].from.lon + ')';

        for (var i = 0; i < plan.leg.length; i++) {
            plan.leg[i]['fromStep'] = plan.steps.length; //connection between step and leg
            var step = {};
            step.startime = i == 0 ? plan.startime : plan.leg[i].startime;
            step.endtime = plan.leg[i].endtime;
            step.mean = {};

            extractDetails(step, plan.leg[i], plan.leg, i, nextFrom);
            nextFrom = null;
            step.length = getLength(plan.leg[i]);
            step.cost = getLegCost(plan, i);

            var t = plan.leg[i].transport.type;
            step.mean.img = getImageName(t, plan.leg[i].transport.agencyId);
            if (!step.mean.img) {
                console.log('UNDEFINED: ' + plan.leg[i].transport.type);
                step.mean.img = getImageName('BUS');
            }
            step.mean.img = 'img/' + step.mean.img + '.png';

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
                            action: $filter('translate')('action_park'),
                            actionDetails: step.to,
                            parking: parking,
                            mean: {
                                img: parking.img
                            }
                        };
                        //change the type of leg for having the information for parking and walking
                        if (plan.leg[i + 1].transport['type'] == 'WALK') {
                            plan.leg[i + 1].transport['type'] = 'PARKWALK';
                        }
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
            plan.leg[i]['toStep'] = plan.steps.length; //connection between step and leg

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
    planService.getPlanConfigure = function () {
        return planConfigure;
    }
    planService.setPlanConfigure = function (configure) {
        planConfigure = configure;
    }
    planService.getSelectedJourney = function () {
        return selectedjourney;
    }
    planService.setSelectedJourney = function (journey) {
        selectedjourney = journey;
    }
    planService.planJourney = function (newPlanConfigure) {
        planConfigure = newPlanConfigure;
        var deferred = $q.defer();
        $http({
            method: 'POST',
            url: Config.getServerURL() + '/plansinglejourney?policyId='+Config.getPlanPolicy(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                "to": {
                    "lon": newPlanConfigure.to.long,
                    "lat": newPlanConfigure.to.lat
                },
                "routeType": newPlanConfigure.routeType,
                "resultsNumber": 5,
                "departureTime": newPlanConfigure.departureTime,
                "from": {
                    "lon": newPlanConfigure.from.long,
                    "lat": newPlanConfigure.from.lat
                },
                "date": newPlanConfigure.date,
                "transportTypes": Config.convertPlanTypes(newPlanConfigure.transportTypes)
            },
            timeout: 10000
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


    planService.addnames = function (newnames) {
        for (var i = 0; i < newnames.length; i++) {
            geoCoderPlaces[newnames[i].name] = {
                latlong: newnames[i].lat + "," + newnames[i].long
            }
        }
        return geoCoderPlaces;
    }
    planService.getnames = function (i) {
        return geoCoderPlaces;
    }
    planService.getTypedPlaces = function (i) {

        var placedata = $q.defer();
        var names = [];
        if (i.length == 0) {
            placedata.resolve(names);
        } else {
            i = i.replace(/\ /g, "+");
            var url = "https://os.smartcommunitylab.it/core.geocoder/spring/address?latlng=" + Config.getMapPosition().lat + ", " + Config.getMapPosition().long + "&distance=" + Config.getDistanceForAutocomplete() + "&address=" + i;
            $http.get(url, {
                timeout: 5000
            }).
            success(function (data, status, headers, config) {
                geoCoderPlaces = [];
                //            places = data.response.docs;
                //store the data
                //return the labels
                k = 0;
                for (var i = 0; i < data.response.docs.length; i++) {
                    temp = '';
                    if (data.response.docs[i].name)
                        temp = temp + data.response.docs[i].name;
                    if (data.response.docs[i].street != data.response.docs[i].name)
                        if (data.response.docs[i].street) {
                            if (temp)
                                temp = temp + ', ';
                            temp = temp + data.response.docs[i].street;
                        }
                    if (data.response.docs[i].housenumber) {
                        if (temp)
                            temp = temp + ', ';
                        temp = temp + data.response.docs[i].housenumber;
                    }
                    if (data.response.docs[i].city) {
                        if (temp)
                            temp = temp + ', ';
                        temp = temp + data.response.docs[i].city;
                    }

                    //check se presente
                    if (!geoCoderPlaces[temp]) {
                        //se non presente
                        names[k] = temp;
                        k++
                        geoCoderPlaces[temp] = {
                            latlong: data.response.docs[i].coordinate
                        }
                    }
                }
                placedata.resolve(names);
            }).
            error(function (data, status, headers, config) {
                //            $scope.error = true;
            });
        }
        return placedata.promise;
    }
    planService.saveTrip = function (tripId, trip, name, requestedFrom, requestedTo) {
        var deferred = $q.defer();
        if (!tripId) {
            tripId = new Date().getTime();
        }
        var tripToSave = {
            "tripId": tripId,
            "data": {
                "originalFrom": {
                    "name": requestedFrom,
                    "lat": trip.from.lat,
                    "lon": trip.from.lon
                },
                "originalTo": {
                    "name": requestedTo,
                    "lat": trip.to.lat,
                    "lon": trip.to.lon
                },
                "originalRequest": planService.getPlanConfigure(),
                "monitor": true,
                "name": name,
                "data": trip
            }
        };
        var savedTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
        if (!savedTrips) {
            savedTrips = {};
        }
        savedTrips[tripId] = tripToSave;
        localStorage.setItem(Config.getAppId() + "_savedTrips", JSON.stringify(savedTrips));
        deferred.resolve(tripToSave);


        //     later for the server
        //$http({
        //            method: 'POST',
        //            url: Config.getServerURL(),
        //            headers: {
        //                'Accept': 'application/json',
        //                'Content-Type': 'application/json'
        //            },
        //            data: {
        //                "originalFrom": {
        //                    "name": requestedFrom,
        //                    "lat": trip.from.lat,
        //                    "lon": trip.from.lon
        //                },
        //                "originalTo": {
        //                    "name": requestedTo,
        //                    "lat": trip.to.lat,
        //                    "lon": trip.to.lon
        //                },
        //                "monitor": true,
        //                "name": name,
        //                "data": trip
        //
        //            }
        //        }).
        //        success(function (data) {
        //            deferred.resolve(data);
        //        }).
        //        error(function (data, status, headers, config) {
        //            console.log(data + status + headers + config);
        //            deferred.reject(data);
        //        });

        return deferred.promise;
    }
    planService.getTripFromMemory = function (tripId) {
        var deferred = $q.defer();
        if (!tripId) {
            deferred.reject();
        }

        var savedTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
        if (!savedTrips) {
            deferred.reject();
        } else {
            deferred.resolve(savedTrips[tripId])
        };



        return deferred.promise;
    }

    planService.deleteTrip = function (tripId) {
        var deferred = $q.defer();
        if (!tripId) {
            deferred.reject();
        }

        var savedTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
        if (!savedTrips) {
            deferred.reject();
        }
        delete savedTrips[tripId]
        localStorage.setItem(Config.getAppId() + "_savedTrips", JSON.stringify(savedTrips));
        deferred.resolve(true);


        return deferred.promise;
    }
    return planService;
})
