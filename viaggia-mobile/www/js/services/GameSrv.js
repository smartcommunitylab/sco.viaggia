angular.module('viaggia.services.game', [])

.factory('GameSrv', function ($q, $http, Config) {
	var gameService = {};

	var localStatus = null;

	gameService.getStatus = function () {
		var deferred = $q.defer();

		//$http.get(Config.getServerURL() + '/getparkingsbyagency/' + agencyId, Config.getHTTPConfig())
		$http.get('data/game/status.json')

		.success(function (status) {
			localStatus = status;
			deferred.resolve(localStatus);
		})

		.error(function (response) {
			deferred.reject(response);
		});

		return deferred.promise;
	};

	gameService.getLocalStatus = function () {
		var deferred = $q.defer();

		if (!localStatus) {
			gameService.getStatus().then(
				function (localStatus) {
					deferred.resolve(localStatus);
				},
				function (response) {
					deferred.reject(response);
				}
			);
		} else {
			deferred.resolve(localStatus);
		}

		return deferred.promise;
	};

	return gameService;
});
