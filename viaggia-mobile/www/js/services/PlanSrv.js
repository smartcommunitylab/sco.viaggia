angular.module('viaggia.services.plan', [])

    .factory('planService', function ($q, $http, $filter, $rootScope, GeoLocate, Config, trackService, LoginService) {

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
                case 'TRANSIT':
                    return $filter('translate')('action_cablecar');
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


        planService.buildConfigureOptions = function (trip) {

            var data = $filter('date')(new Date(trip.data.data.startime), 'MM/dd/yyyy');
            var time = $filter('date')(new Date(trip.data.data.startime), 'hh:mma');
            var configure = {
                "from": {
                    "name": trip.data.originalFrom.name,
                    "lat": trip.data.originalFrom.lat,
                    "long": trip.data.originalFrom.lon
                },
                "to": {
                    "name": trip.data.originalTo.name,
                    "lat": trip.data.originalTo.lat,
                    "long": trip.data.originalTo.lon
                },
                "departureTime": time,
                "date": data,
                "wheelchair": trip.data.wheelchair
            }
            return configure;
        }
        planService.setFromOrTo = function (value) {
            fromOrTo = value;
        }
        planService.getFromOrTo = function () {
            return fromOrTo;
        }
        //    planService.setTripId = function (id) {
        //        tripId = id;
        //    }
        //    planService.getTripId = function () {
        //        return tripId;
        //    }
        //
        //    var tripName = null;
        //    planService.setTripName = function (name) {
        //        tripName = name;
        //    }
        //    planService.getTripName = function () {
        //        return tripName;
        //    }
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
                    var costnote = {
                        type: 'cost',
                        value: cost
                    };
                    res.note.push(costnote);
                }
                if (leg.extra.searchTime && leg.extra.searchTime.max > 0) {
                    res.time = leg.extra.searchTime.min + '-' + leg.extra.searchTime.max + '\'';
                    var timenote = {
                        type: 'time',
                        value: leg.extra.searchTime.min + '-' + leg.extra.searchTime.max + '\''
                    };
                    res.note.push(timenote);
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
                var costnote = {
                    type: 'cost',
                    value: cost
                };
                res.note.push(costnote);
                res.type = 'PARK';
            }
            if (leg.to.stopId && leg.to.stopId.id) {
                //            var parkingPlace = parking.getParking(leg.to.stopId.agencyId, leg.to.stopId.id);
                var parkingPlace = leg.to.name;
                res.place = parkingPlace != null ? parkingPlace : leg.to.stopId.id;
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
                    elem.note = [{
                        value: it.leg[i].transport.routeShortName
                    }];
                } else if (t == 'CAR') {
                    if (meanTypes.indexOf('CAR') < 0) {
                        var parking = extractParking(it.leg[i], false);
                        if (parking) {
                            if (parking.type == 'STREET') {
                                //elem.note = parking.note;
                                means.push(elem);
                                elem = {
                                    note: parking.note,
                                    parking_street: true
                                };
                            } else {
                                means.push(elem);
                                elem = {
                                    img: parking.img,
                                    note: parking.note,
                                    parking_street: false
                                };
                            }
                        }
                    }
                }

                var newMt = t + (elem.note.length > 0 ? elem.note[0].value : '');
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
            if (leg.transport.type == 'BUS' || leg.transport.type == 'TRAIN') {
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
                step.alertText = planService.buildAlertText(plan.leg[i]);
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
            if (planConfigure == null) {
                planService.setName('from', null);
                planService.setName('to', null);
            }
        }
        planService.getSelectedJourney = function () {
            return selectedjourney;
        }
        planService.setSelectedJourney = function (journey) {
            selectedjourney = journey;
        }
        var distancePlanPolicies = function (destination, singlePlanPolicy) {
            return GeoLocate.distance([destination.lat, destination.long], singlePlanPolicy.center)
        }
        planService.choosePlanPolicy = function (newPlanConfigure, planPolicies) {
            //checkconfigure and choose the right plan policy
            var destination = newPlanConfigure.to;
            for (var i = 0; i < planPolicies.length; i++) {
                if (distancePlanPolicies(destination, planPolicies[i]) < planPolicies[i].distance)
                    return planPolicies[i].name
            }
            return Config.getDefaultPlanPolicy();
        }
        planService.planJourney = function (newPlanConfigure) {
            planConfigure = newPlanConfigure;
            var deferred = $q.defer();
            var userId = LoginService.getUserProfile().userId;
            var appName = Config.getAppName();
            $http({
                method: 'POST',
                url: Config.getServerURL() + '/plansinglejourney?policyId=' + planService.choosePlanPolicy(newPlanConfigure, Config.getPlanPolicy()),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'UserID': userId,
                    'AppName': appName
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
                    "wheelchair": newPlanConfigure.wheelchair,
                    "transportTypes": Config.convertPlanTypes(newPlanConfigure.transportTypes)
                },
                timeout: 10000
            }).
                success(function (data, status, headers, config) {
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
                var url = Config.getGeocoderURL() + "/address?latlng=" + Config.getMapPosition().lat + ", " + Config.getMapPosition().long + "&distance=" + Config.getDistanceForAutocomplete() + "&address=" + i;
                $http.get(url, Config.getGeocoderConf()).
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

        function getDaysOfRecurrency(days) {
            var returndays = [];
            for (var len = 0; len < days.length; len++) {
                if (days[len].checked) {
                    returndays.push(len + 1);
                }
            }
            return returndays;
        };

        planService.saveTrip = function (tripId, trip, name, requestedFrom, requestedTo, recurrency) {
            var deferred = $q.defer();
            var daysOfWeek = getDaysOfRecurrency(recurrency);
            var newTrip = false;
            if (!tripId) {
                tripId = new Date().getTime();
                newTrip = true;
            }
            //console.log(JSON.stringify(trip));

            var urlBuilt = Config.getServerURL() + "/itinerary";
            var databuilt = buildData(null, trip, name, requestedFrom, requestedTo, recurrency, daysOfWeek);
            //        if (!newTrip) {
            //            //create a new and delete the old one
            //            //urlBuilt = Config.getServerURL() + "/itinerary/" + tripId;
            //            databuilt = buildData(tripId, trip, name, requestedFrom, requestedTo, recurrency, daysOfWeek);
            //        } else {
            //            //urlBuilt = Config.getServerURL() + "/itinerary";
            //            databuilt = buildData(null, trip, name, requestedFrom, requestedTo, recurrency, daysOfWeek);
            //        }
            var methodTrip = 'POST';
            //        if (!newTrip) {
            //            methodTrip = 'PUT';
            //}
            LoginService.getValidAACtoken().then(function (token) {
                $http({
                    method: methodTrip,
                    url: urlBuilt,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token

                    },
                    data: databuilt,
                    timeout: 10000
                }).
                    success(function (data) {
                        var savedTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
                        if (data.clientId) {
                            databuilt.clientId = data.clientId;
                        } else {
                            databuilt.clientId = tripId;

                        }
                        if (!savedTrips) {
                            savedTrips = {};
                        }
                        savedTrips[databuilt.clientId] = databuilt;
                        localStorage.setItem(Config.getAppId() + "_savedTrips", JSON.stringify(savedTrips));
                        if (!newTrip) {
                            // trackService.updateNotification(planService.getTrips(), databuilt.clientId, "modify");
                            //delete the old one from local storage and from server
                            planService.deleteTrip(tripId).then(function (value) {
                                //console.log(JSON.stringify(value));
                                planService.getTrips().then(function (trips) {
                                    trackService.updateNotification(trips, databuilt.clientId, "delete");
                                    //change bookmark if present
                                    deferred.resolve(databuilt);

                                });
                            }, function (error) {
                                //in case delete has some problems delete from localstorage
                                localDelete(tripId, deferred);
                                planService.getTrips().then(function (trips) {
                                    trackService.updateNotification(trips, databuilt.clientId, "modify");
                                    deferred.resolve(true);

                                });
                                console.log(JSON.stringify(error));
                            });


                        } else {
                            planService.getTrips().then(function (trips) {
                                trackService.updateNotification(trips, databuilt.clientId, "create");
                                deferred.resolve(databuilt);

                            });
                            //trackService.updateNotification(planService.getTrips(), databuilt.clientId, "create");
                        }
                    }).error(function (data, status, headers, config) {
                        console.log(data + status + headers + JSON.stringify(config));
                        deferred.reject(data);
                    });
            });




            return deferred.promise;
        }


        function buildData(tripId, trip, name, requestedFrom, requestedTo, recurrency, daysOfWeek) {
            databuilt = null;
            if (tripId) {
                databuilt = {
                    'clientId': tripId,
                    'data': trip.original,
                    'originalFrom': {
                        'name': requestedFrom,
                        'lat': trip.from.lat,
                        'lon': trip.from.lon
                    },
                    'originalTo': {
                        'name': requestedTo,
                        'lat': trip.to.lat,
                        'lon': trip.to.lon
                    },
                    'name': name,
                    'recurrency': {
                        'daysOfWeek': daysOfWeek
                    }
                }
            } else {
                databuilt = {
                    'data': trip.original,
                    'originalFrom': {
                        'name': requestedFrom,
                        'lat': trip.from.lat,
                        'lon': trip.from.lon
                    },
                    'originalTo': {
                        'name': requestedTo,
                        'lat': trip.to.lat,
                        'lon': trip.to.lon
                    },
                    'name': name,
                    'recurrency': {
                        'daysOfWeek': daysOfWeek
                    }
                }
            }
            return databuilt;
        }
        planService.mmddyyyy2date = function (s) {
            return new Date(s.substr(6, 4), s.substr(0, 2) - 1, s.substr(3, 2));
        }

        planService.convertTo24Hour = function (time) {
            var hours = parseInt(time.substr(0, 2));
            if (time.indexOf('AM') != -1 && hours == 12) {
                time = time.replace('12', '0');
            }
            if (time.indexOf('PM') != -1 && hours < 12) {
                time = time.replace(hours, (hours + 12));
            }
            if (time.match(/0..:/))
                time = time.substring(1);
            return time.replace(/(AM|PM)/, '');

        }
        var editInstance = null;
        planService.setEditInstance = function (trip) {
            editInstance = trip;
        };
        planService.getEditInstance = function () {
            return editInstance;
        };

        planService.getTrip = function (tripId) {
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
        planService.buildConfigureOptions = function (trip) {

            var data = $filter('date')(new Date(trip.data.startime), 'MM/dd/yyyy');
            var time = $filter('date')(new Date(trip.data.startime), 'hh:mma');
            var from = {};
            if (trip.originalFrom) {
                from["name"] = trip.originalFrom.name;
                from["lat"] = trip.originalFrom.lat;
                from["long"] = trip.originalFrom.lon;
            } else {
                from["name"] = trip.data.from.name;
                from["lat"] = trip.data.from.lat;
                from["long"] = trip.data.from.lon;
            }
            var to = {};
            if (trip.originalTo) {
                to["name"] = trip.originalTo.name;
                to["lat"] = trip.originalTo.lat;
                to["long"] = trip.originalTo.lon;

            } else {
                to["name"] = trip.data.to.name;
                to["lat"] = trip.data.to.lat;
                to["long"] = trip.data.to.lon;
            }

            var configure = {
                "from": from,
                "to": to,
                "departureTime": time,
                "date": data,
            }
            return configure;
        }
        planService.getTrips = function () {
            var deferred = $q.defer();
            var savedTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
            if (!savedTrips) {
                //try sync with server
                LoginService.getValidAACtoken().then(function (token) {
                    $http({
                        method: 'GET',
                        url: Config.getServerURL() + "/itinerary",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token

                        },
                        timeout: 10000
                    }).
                        success(function (data) {
                            if (!savedTrips) {
                                savedTrips = {};
                            }
                            // planService.getTrips().then(function (trips) {
                                for (var i = 0; i < data.length; i++) {
                                    savedTrips[data[i].clientId] = data[i];
                                    planService.setPlanConfigure(null);
                                    trackService.updateNotification(data, data[i].clientId, "create");
                                }
                                localStorage.setItem(Config.getAppId() + "_savedTrips", JSON.stringify(savedTrips));
                                deferred.resolve(data);
                            // },function (err){
                            //     deferred.reject();
                            // });
                            // for (var i = 0; i < data.length; i++) {
                            //     savedTrips[data[i].clientId] = data[i];
                            //     planService.setPlanConfigure(null);
                            //     planService.getTrips().then(function (trips) {
                            //         trackService.updateNotification(trips, data[i].clientId, "create");
                            //         deferred.resolve(data);


                            //     });
                            // }
                            // localStorage.setItem(Config.getAppId() + "_savedTrips", JSON.stringify(savedTrips));


                        }).error(function (data, status, headers, config) {
                            console.log(data + status + headers + JSON.stringify(config));
                            deferred.reject(data);
                        });
                });
            } else {
                deferred.resolve(savedTrips);

            }
            return deferred.promise;

        }

        var localDelete = function (tripId, deferred) {
            var savedTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
            if (!savedTrips) {
                deferred.reject();
            }
            var trip = savedTrips[tripId];
            delete savedTrips[tripId];
            localStorage.setItem(Config.getAppId() + "_savedTrips", JSON.stringify(savedTrips));
            //delete from bookmarks

            planService.setPlanConfigure(null);
            deferred.resolve(true);

            //        planService.getTrips().then(function (trips) {
            //            trackService.updateNotification(trips, trip.clientId, "delete");
            //            deferred.resolve(true);
            //
            //        });
            //        trackService.updateNotification(planService.getTrips(), tripId, "delete");
        }


        planService.deleteTrip = function (tripId) {
            var deferred = $q.defer();
            if (!tripId) {
                deferred.reject();
            } else {
                LoginService.getValidAACtoken().then(function (token) {
                    $http.delete(Config.getServerURL() + "/itinerary/" + tripId, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token

                        },
                        timeout: 10000
                    }).
                        success(function (data) {
                            localDelete(tripId, deferred);
                            planService.getTrips().then(function (trips) {
                                trackService.updateNotification(trips, tripId, "delete");
                                deferred.resolve(true);

                            });
                        }).error(function (data, status, headers, config) {
                            // does not exist server side
                            if (status == 400) {
                                localDelete(tripId, deferred);
                                //delete notif
                                planService.getTrips().then(function (trips) {
                                    trackService.updateNotification(trips, tripId, "delete");
                                    deferred.reject(data);

                                });
                            } else {
                                console.log(data + status + headers + JSON.stringify(config));
                                deferred.reject(data);
                            }
                        });
                })
            }
            return deferred.promise;
        }

        planService.hasAlerts = function (it) {
            var has = false;
            if (it.leg) it.leg.forEach(function (l) {
                has = has || planService.legHasAlerts(l)
            });
            return has;
        }
        planService.legHasAlerts = function (leg) {
            return checkArray(leg.alertStrikeList) || checkArray(leg.alertDelayList) || checkArray(leg.alertParkingList) || checkArray(leg.alertRoadList) || checkArray(leg.alertAccidentList);
        }
        planService.buildAlertText = function (leg) {
            var txt = [];
            if (checkArray(leg.alertDelayList)) {
                leg.alertDelayList.forEach(function (a) {
                    txt.push($filter('translate')('alert_delay', {
                        mins: Math.ceil(a.delay / 60000)
                    }));
                });
            }
            return txt;
        }

        function checkArray(a) {
            return a != null && a.length > 0;
        }

        return planService;
    })
