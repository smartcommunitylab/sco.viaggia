angular.module('viaggia.services.game', [])

.factory('GameSrv', function ($q, $http, Config, userService) {
	var gameService = {};

	var localStatus = null;
	var localRanking = null;
    var returnValue = {
            "stats":[
            {   "from":1497312000000 ,
                "to":1497398399000,
                "means":{
                "bike":2500,
                "walk":1200,
                "public":8200,
                "car":2700,
                "date":'13/06/2017'
                }
                },
            {   "from":1497225600000 ,
                "to":1497311999000,
                "means":{
                "bike":0,
                "walk":5000,
                "public":8000,
                "car":0,
                "date":'12/06/2017'
                }
            },
            {   "from":1497139200000,
                "to":1497225599000,
                "means":{
                "bike":4000,
                "walk":2000,
                "public":7000,
                "car":2200,
                "date":'11/06/2017'
                }
            },
            {   "from":1497052800000,
                "to":1497139199000,
                "means":{
                "bike":0,
                "walk":700,
                "public":0,
                "car":7500,
                "date":'10/06/2017'
                }
            },
            {   "from":1496966400000,
                "to":1497052799000,
                "means":{
                "bike":7800,
                "walk":3300,
                "public":4700,
                "car":4500,
                "date":'09/06/2017'
                }
            },
            {   "from":1496880000000,
                "to":1496966399000,
                "means":{
                "bike":0,
                "walk":2300,
                "public":12000,
                "car":0,
                "date":'08/06/2017'
                }
            },
            {   "from":1496793600000 ,
                "to":1496879999000,
                "means":{
                "bike":1600,
                "walk":1200,
                "public":8200,
                "car":2700,
                "date":'07/06/2017'
                }
                },
            {   "from":1496707200000 ,
                "to":1496793599000,
                "means":{
                "bike":0,
                "walk":5000,
                "public":8000,
                "car":0,
                "date":'06/06/2017'
                }
            },
            {   "from":1496620800000,
                "to":1496707199000,
                "means":{
                "bike":8000,
                "walk":2000,
                "public":7000,
                "car":2200,
                "date":'05/06/2017'
                }
            },
            {   "from":1496534400000,
                "to":1496620799000,
                "means":{
                "bike":0,
                "walk":1800,
                "public":0,
                "car":11500,
                "date":'04/06/2017'
                }
            },
            {   "from":1496448000000,
                "to":1496534399000,
                "means":{
                "bike":3400,
                "walk":2000,
                "public":7100,
                "car":6000,
                "date":'03/06/2017'
                }
            },
            {   "from":1496361600000,
                "to":1496447999000,
                "means":{
                "bike":0,
                "walk":4700,
                "public":9500,
                "car":0,
                "date":'02/06/2017'
                }
            },
            {   "from":1496275200000 ,
                "to":1496361599000,
                "means":{
                "bike":0,
                "walk":7400,
                "public":4500,
                "car":0,
                "date":'01/06/2017'
                }
            },
            {   "from":1496188800000,
                "to":1496275199000,
                "means":{
                "bike":2200,
                "walk":3300,
                "public":4000,
                "car":1300,
                "date":'31/05/2017'
                }
            },
            {   "from":1496102400000,
                "to":1496188799000,
                "means":{
                "bike":0,
                "walk":2400,
                "public":0,
                "car":4800,
                "date":'30/05/2017'
                }
            },
            {   "from":1496016000000,
                "to":1496102399000,
                "means":{
                "bike":9100,
                "walk":2000,
                "public":3800,
                "car":5400,
                "date":'29/05/2017'
                }
            },
            {   "from":1495929600000,
                "to":1496015999000,
                "means":{
                "bike":0,
                "walk":4200,
                "public":8800,
                "car":0,
                "date":'28/05/2017'
                }
            },
            {   "from":1495843200000 ,
                "to":1495929599000,
                "means":{
                "bike":1000,
                "walk":2000,
                "public":3000,
                "car":0,
                "date":'27/05/2017'
                }
                },
            {   "from":1495756800000 ,
                "to":1495843199000,
                "means":{
                "bike":2000,
                "walk":1700,
                "public":0,
                "car":1000,
                "date":'26/05/2017'
                }
            },
            {   "from":1495670400000,
                "to":1495756799000,
                "means":{
                "bike":7400,
                "walk":0,
                "public":15000,
                "car":0,
                "date":'25/05/2017'
                }
            },
            {   "from":1495584000000,
                "to":1495670399000,
                "means":{
                "bike":0,
                "walk":700,
                "public":0,
                "car":7500,
                "date":'24/05/2017'
                }
            },
            {   "from":1495497600000,
                "to":1495583999000,
                "means":{
                "bike":6700,
                "walk":4200,
                "public":0,
                "car":2700,
                "date":'23/05/2017'
                }
            },
            {   "from":1495411200000,
                "to":1495497599000,
                "means":{
                "bike":0,
                "walk":17800,
                "public":0,
                "car":3600,
                "date":'22/05/2017'
                }
            },
            ]
    }
    gameService.getStatistics = function(how, from, to ) {
        var deferred = $q.defer();
        var returnValuee = [];
        userService.getValidToken().then(
			function (token) {

                if (returnValue.stats.length > to) {
                    for (var i = from; i < to; i++) {
                        returnValuee.push(returnValue.stats[i]);
                    }
                } else {
                    for (var i = from; i < returnValue.stats.length; i++) {
                          returnValuee.push(returnValue.stats[i]);
                    }
                }

                deferred.resolve(returnValuee);
//                deferred.reject();
            });
        return deferred.promise;
    }
	/* get remote status */
	gameService.getStatus = function () {
		var deferred = $q.defer();

		userService.getValidToken().then(
			function (token) {
				$http.get(Config.getGamificationURL() + '/out/rest/status' + '?token=' + token, Config.getHTTPConfig())

				.success(function (status) {
					localStatus = status;
					deferred.resolve(localStatus);
				})

				.error(function (response) {
					deferred.reject(response);
				});
			},
			function () {
				deferred.reject();
			}
		);

		return deferred.promise;
	};

    	/* get local status (get remote first if null) */
	gameService.resetLocalStatus = function () {
      localStatus = null;
    }


	/* get local status (get remote first if null) */
	gameService.getLocalStatus = function () {
		var deferred = $q.defer();

//		if (!localStatus) {
			gameService.getStatus().then(
				function (localStatus) {
					deferred.resolve(localStatus);
				},
				function (response) {
					deferred.reject(response);
				}
			);
//		} else {
//			deferred.resolve(localStatus);
//		}

		return deferred.promise;
	};

	/* get ranking */
	gameService.getRanking = function (when, start, end) {
		var deferred = $q.defer();

		userService.getValidToken().then(
			function (token) {
				var timestamp = null;

				// TODO handle "when"!
				if (when === 'now') {
					// Current week
					var d = new Date();
					timestamp = d.getTime();
				} else if (when === 'last') {
					// Last week
					var d = new Date();
					d.setDate(d.getDate() - 7);
					timestamp = d.getTime();
				}

				var config = Config.getHTTPConfig();
				if (!config.params) {
					config.params = {};
				}

				config.params['token'] = token;

				if ((!!timestamp && timestamp < 0) || (!!start && start < 0) || (!!end && end < 1) || (!!start && !!end && end <= start)) {
					deferred.reject();
				}

				if (!!timestamp) {
					config.params['timestamp'] = timestamp;
				}

				if (!!start) {
					config.params['start'] = start;
				}

				if (!!end) {
					config.params['end'] = end;
				}

				$http.get(Config.getGamificationURL() + '/out/rest/classification', config)

				.success(function (ranking) {
					localRanking = ranking;
					deferred.resolve(localRanking);
				})

				.error(function (response) {
					deferred.reject(response);
				});
			},
			function () {
				deferred.reject();
			}
		);

		return deferred.promise;
	};

	return gameService;
});
