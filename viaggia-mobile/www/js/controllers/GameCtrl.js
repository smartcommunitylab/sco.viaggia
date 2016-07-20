angular.module('viaggia.controllers.game', [])

.controller('GameCtrl', function ($scope, GameSrv) {
	$scope.currentUser = null;
	$scope.status = null;
	$scope.ranking = null;
	$scope.prize = null;

	$scope.rankingFilterOptions = ['now', 'last', 'global'];

	GameSrv.getLocalStatus().then(
		function (status) {
			$scope.status = status;
		}
	);

	GameSrv.getRanking($scope.rankingFilterOptions[0]).then(
		function (ranking) {
			$scope.currentUser = ranking['actualUser'];
			$scope.ranking = ranking['classificationList'];
		}
	);
})

.controller('PointsCtrl', function ($scope) {
	// green leaves: Green Leaves
	// bike aficionado: Bike Trip Badge
	// sustainable life: Zero Impact Badge
	// public transport aficionado: Public Transport Badge
	// park and ride pioneer: Park And Ride Badge
	// recommendations: User Recommendation Badge
	// leaderboard top 3: Leaderboard Top 3 Badge

	$scope.badges = {};
	$scope.badgeTypes = ['green leaves', 'bike aficionado', 'sustainable life', 'public transport aficionado', 'park and ride pioneer', 'recommendations', 'leaderboard top 3'];

	$scope.$watch('status.badgeCollectionConcept', function (newBadges, oldBadges) {

		var badges = {};

		if (!!$scope.status) {
			angular.forEach($scope.badgeTypes, function (badgeType) {
				for (var i = 0; i < $scope.status['badgeCollectionConcept'].length; i++) {
					if ($scope.status['badgeCollectionConcept'][i].name === badgeType) {
						badges[badgeType] = $scope.status['badgeCollectionConcept'][i]['badgeEarned'];
					}
				}
			});
		}

		$scope.badges = badges;
	});
})

.controller('ChallengesCtrl', function ($scope, $http, $filter, $ionicScrollDelegate, $ionicPopup) {
	$scope.challenges = [];

	$scope.filter = {
		open: false,
		toggle: function () {
			this.open = !this.open;
			$ionicScrollDelegate.resize();
		},
		filterBy: function (selection) {
			if (this.selected !== selection) {
				this.selected = selection;
				this.filter(this.selected);
			}
			this.toggle();
		},
		update: function () {
			this.filter(this.selected);
		},
		filter: function (selection) {},
		options: [],
		selected: null
	};

	$scope.filter.options = ['old', 'active'];
	$scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;

	$scope.filter.filter = function (selection) {
		if (!!$scope.status && !!$scope.status['challengeConcept'] && (selection === 'active' || selection === 'old')) {
			$scope.challenges = $scope.status['challengeConcept'][selection + 'ChallengeData'];
		}
	};

	$scope.$watch('status.challengeConcept', function (newChallenges, oldChallenges) {
		$scope.filter.update();
	});

	$scope.showChallengeInfo = function (challenge) {
		// FIXME temporarly not null
		if (!challenge) {
			challenge = {
				challCompleteDesc: 'Lorem ipsum dolor sic amet'
			};
		}

		var infoPopup = $ionicPopup.alert({
			title: $filter('translate')('game_tab_challenges_infopopup_title'),
			subTitle: '',
			cssClass: '',
			template: challenge.challCompleteDesc,
			okText: $filter('translate')('pop_up_close'),
			okType: ''
		});

		infoPopup.then(
			function () {}
		);
	};


})

.controller('RankingsCtrl', function ($scope, $ionicScrollDelegate, GameSrv) {
	$scope.filter = {
		open: false,
		toggle: function () {
			this.open = !this.open;
			$ionicScrollDelegate.resize();
		},
		filterBy: function (selection) {
			if (this.selected !== selection) {
				this.selected = selection;
				this.filter(this.selected);
			}
			this.toggle();
		},
		update: function () {
			this.filter(this.selected);
		},
		filter: function (selection) {},
		options: [],
		selected: null
	};

	$scope.filter.options = $scope.rankingFilterOptions;
	$scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;

	$scope.filter.filter = function (selection) {
		GameSrv.getRanking(selection).then(
			function (ranking) {
				$scope.currentUser = ranking['actualUser'];
				$scope.ranking = ranking['classificationList'];
			}
		);
	};

	$scope.filter.filter($scope.filter.selected);

	$scope.rankingStyle = {};

	var generateRankingStyle = function () {
		// header 44, tabs 49, filter 44, listheader 44, my ranking 48
		$scope.rankingStyle = {
			'height': window.innerHeight - (44 + 49 + 44 + 44 + 48) + 'px'
		};
		$ionicScrollDelegate.$getByHandle('rankingScroll').resize();
	};

	generateRankingStyle();

	window.addEventListener('orientationchange', function () {
		generateRankingStyle();
	}, false);
});
