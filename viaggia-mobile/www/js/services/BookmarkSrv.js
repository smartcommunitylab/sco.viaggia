angular.module('viaggia.services.bookmarks', [])

.factory('bookmarkService', function ($q, $rootScope, Config, parkingService, bikeSharingService, planService) {
    var repo = '';
    var mapBookmarks = {};
    Config.init().then(function () {
        repo = Config.getAppId() + '_bookmarks';
        // taxi = Config.getAppId() + '_bookmarks_taxi';
        //take map of flags
        mapBookmarks = Config.getAppId() + '_bookmarks_map'

    });

    var getStoredBookmarks = function () {
        var value = localStorage.getItem(repo);
        if (!value) {
            value = [];
        } else {
            value = JSON.parse(value);
        }
        return value;
    };
    var getMapBookmarks = function () {
        var value = localStorage.getItem(mapBookmarks);
        if (!value) {
            value = [];
        } else {
            value = JSON.parse(value);
        }
        return value;
    };
    var getDefaultBookmarks = function () {
        return angular.copy(Config.getPrimaryLinks());
    };
    var allNewBookMarksArePresent = function () {
        var areAllNewBookMarkPresent = true;
        var map = getMapBookmarks();
        //if all default bookmarks are present in the object mapbookmark
        var defList = getDefaultBookmarks();
        var keysOfDef = {};
        for (var i = 0; i < defList.length; i++) {
            if (!map[defList[i].state])
                return false;
            keysOfDef[defList[i].state] = true;
        }

        //..and viceversa in case of remove
        for (var key in map) {
            if (!keysOfDef[key])
                return false;
        }
        return true;

    }
    var getMapDefaultBookmark = function () {
        //get the new map object based on bookmarks
        var mapBookMarks = {};
        // var map = getStoredBookmarks();
        var defList = getDefaultBookmarks();
        for (var i = 0; i < defList.length; i++) {
            mapBookMarks[defList[i].state] = true;
        }
        return mapBookMarks;
    }
    var getBookmarks = function () {
        //if (!localStorage.getItem(repo) || (localStorage.getItem(repo) && !taxi)) {+
        if (!localStorage.getItem(repo) || !allNewBookMarksArePresent()) {
            //first install or update
            var defList = getDefaultBookmarks();
            var mapDefaultBookMark = getMapDefaultBookmark();
            defList.forEach(function (e) {
                e.home = true;
            });
            localStorage.setItem(repo, JSON.stringify(defList));
            //localStorage.setItem(taxi, true);
            localStorage.setItem(mapBookmarks, JSON.stringify(mapDefaultBookMark));
        }
        return getStoredBookmarks();
    };

    /**
     * Custom template for specific bookmark type
     */
    $rootScope.getBookmarkItemTemplate = function (type) {
        switch (type) {
        case 'TRAINSTOP':
        case 'BUSSTOP':
        case 'BUSSUBURBANSTOP':
            {
                return 'templates/bm/stop.html';
                break;
            }
        case 'TRAIN':
        case 'BUS':
        case 'BUSSUBURBAN':
            {
                return 'templates/bm/line.html';
            }
        case 'PARKING':
            {
                return 'templates/bm/parking.html';
            }
        case 'BIKESHARING':
            {
                return 'templates/bm/bikesharing.html';
            }
        case 'TRIP':
            {
                return 'templates/bm/trip.html';
            }
        default:
            return 'templates/bm/default.html';
        }
    }


    var updateRT = function (b) {
        switch (b.type) {
        case 'PARKING':
            {
                parkingService.getParking(b.data.agencyId, b.data.parkingId).then(function (p) {
                    if (p.monitored && p.slotsAvailable > -2) {
                        p.availLevel = p.slotsAvailable <= 5 ? 'avail-red' : p.slotsAvailable > 20 ? 'avail-green' : 'avail-yellow';
                    }
                    b.parking = p;
                });
                break;
            }
        case 'BIKESHARING':
            {
                bikeSharingService.getStation(b.data.agencyId, b.data.parkingId).then(function (p) {
                    b.parking = p;
                });
                break;
            }
        case 'TRIP':
            {
                planService.getTrip(b.data.tripId).then(function (trip) {
                    b.trip = trip;
                });
                break;
            }
        default:
            {}
        }
    }

    return {
        /**
         * add bookmark to the list. Return promise of the update bookmark list
         */
        addBookmark: function (bm) {
            var deferred = $q.defer();

            var list = getBookmarks();
            bm.home = true;
            bm.removable = true;
            list.splice(0, 0, bm);
            localStorage.setItem(repo, JSON.stringify(list));
            deferred.resolve(list);

            return deferred.promise;
        },
        /**
         * Return promise of current list of bookmarks with real time data.
         */
        getBookmarksRT: function () {
            var deferred = $q.defer();
            var list = getBookmarks();
            var filtered = [];
            list.forEach(function (b) {
                updateRT(b);
            });
            deferred.resolve(list);
            return deferred.promise;
        },
        /**
         * Return promise of current list of bookmarks. Initially, set to the list of predefined bookmarks from the configuration (cannot be removed permanently).
         */
        getBookmarks: function () {
            var deferred = $q.defer();
            deferred.resolve(getBookmarks());
            return deferred.promise;
        },
        /**
         * Return position of the bookmark with the specified path in the list.
         */
        indexOfBookmark: function (bm) {
            var list = getBookmarks();
            for (var i = 0; i < list.length; i++) {
                if (bm == list[i].state) return i;
            }
            return -1;
        },
        /**
         * Remove the bookmark at the specified index from the list (if possible). Return promise of the update bookmark list
         */
        removeBookmark: function (idx) {
            var deferred = $q.defer();
            var list = getBookmarks();
            if (list.length > idx && list[idx].removable) {
                list.splice(idx, 1);
                localStorage.setItem(repo, JSON.stringify(list));
            }
            deferred.resolve(list);

            return deferred.promise;
        },
        /**
         * Add/remove the bookmark to/from the home page. Return promise of the update bookmark list
         */
        toggleHome: function (idx) {
            var deferred = $q.defer();
            var list = getBookmarks();
            list[idx].home = !list[idx].home;
            localStorage.setItem(repo, JSON.stringify(list));
            deferred.resolve(list);

            return deferred.promise;
        },
        /**
         * Change order of two bookmarks. Return promise of the update bookmark list
         */
        reorderBookmark: function (idxFrom, idxTo) {
            var deferred = $q.defer();

            var list = getBookmarks();
            var from = list[idxFrom];
            if (idxTo + 1 == list.length) {
                list.push(from); //add to from
            } else {
                list.splice(idxTo, 0, from); //add to from
            }
            if (idxFrom > idxTo) { //remove from
                list.splice(idxFrom + 1, 1);
            } else {
                list.splice(idxFrom, 1);
            }
            localStorage.setItem(repo, JSON.stringify(list));
            deferred.resolve(list);

            return deferred.promise;
        },
        /**
         * Return the style of the bookmark button for the element
         */
        getBookmarkStyle: function (bm) {
            return this.indexOfBookmark(bm) >= 0 ? 'ic_bookmark' : 'ic_bookmark-outline';
        },
        /**
         * Add/remove a bookmark for the element of the specified type, path, and title. Returns promise for the update style.
         */
        toggleBookmark: function (path, title, type, data) {
            var deferred = $q.defer();
            var pos = this.indexOfBookmark(path);
            if (pos >= 0) {
                this.removeBookmark(pos).then(function () {
                    deferred.resolve('ic_bookmark-outline');
                });
            } else {
                var color = null,
                    icon = null;

                switch (type) {
                case 'TRAIN':
                    {
                        var ct = Config.getColorsTypes()[type];
                        color = ct.color;
                        icon = 'ic_train';
                        break;
                    }
                case 'BUS':
                    {
                        var ct = Config.getColorsTypes()[type];
                        color = ct.color;
                        icon = 'ic_urban-bus';
                        break;
                    }
                case 'BUSSUBURBAN':
                    {
                        var ct = Config.getColorsTypes()[type];
                        color = ct.color;
                        icon = 'ic_extraurban-bus';
                        break;
                    }
                case 'TRAINSTOP':
                    {
                        var ct = Config.getColorsTypes()['TRAIN'];
                        color = ct.color;
                        icon = 'ic_m_train';
                        break;
                    }
                case 'BUSSTOP':
                    {
                        var ct = Config.getColorsTypes()['BUS'];
                        color = ct.color;
                        icon = 'ic_m_urban_bus';
                        break;
                    }
                case 'BUSSUBURBANSTOP':
                    {
                        var ct = Config.getColorsTypes()['BUSSUBURBAN'];
                        color = ct.color;
                        icon = 'ic_m_extraurban_bus';
                        break;
                    }
                case 'PARKING':
                    {
                        var ct = Config.getColorsTypes()['PARKING'];
                        color = ct.color;
                        icon = 'ic_m_parking-lot';
                        break;
                    }
                case 'BIKESHARING':
                    {
                        var ct = Config.getColorsTypes()['BIKESHARING'];
                        color = ct.color;
                        icon = 'ic_m_bike';
                        break;
                    }
                case 'TRIP':
                    {
                        var ct = Config.getColorsTypes()['TRIP'];
                        color = ct.color;
                        icon = 'ic_folder';
                        break;
                    }
                }

                this.addBookmark({
                    "state": path,
                    "label": title,
                    "icon": icon,
                    "color": color,
                    type: type,
                    data: data
                }).then(function () {
                    deferred.resolve('ic_bookmark');
                });
            }
            return deferred.promise;
        }
    };
})
