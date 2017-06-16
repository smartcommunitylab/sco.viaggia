angular.module('viaggia.services.game', [])

.factory('GameSrv', function ($q, $http, Config, userService) {
	var gameService = {};

	var localStatus = null;
	var localRanking = null;

    gameService.getStatistics = function(how, from, to ) {
        var deferred = $q.defer();

        var returnValue = {
            "stats":[
            {   "from":1497312000 ,
                "to":1497354006,
                "means":{
                "bike":2500,
                "walk":1200,
                "public":8200,
                "car":2700,
                "date":'13/06/2017'
                }
                },
            {   "from":1497312000 ,
                "to":1497354006,
                "means":{
                "bike":0,
                "walk":5000,
                "public":8000,
                "car":0,
                "date":'12/06/2017'
                }
            },
            {   "from":1497225600,
                "to":1497268800,
                "means":{
                "bike":4000,
                "walk":2000,
                "public":7000,
                "car":2200,
                "date":'11/06/2017'
                }
            },
            {   "from":1497225600,
                "to":1497268800,
                "means":{
                "bike":0,
                "walk":700,
                "public":0,
                "car":7500,
                "date":'10/06/2017'
                }
            },
            {   "from":1497225600,
                "to":1497268800,
                "means":{
                "bike":4300,
                "walk":3000,
                "public":4700,
                "car":7500,
                "date":'10/06/2017'
                }
            },
            {   "from":1497225600,
                "to":1497268800,
                "means":{
                "bike":0,
                "walk":1400,
                "public":13000,
                "car":0,
                "date":'10/06/2017'
                }
            }
            ]
        }
        userService.getValidToken().then(
			function (token) {
                deferred.resolve(returnValue);
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
