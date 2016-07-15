angular.module('viaggia.controllers.game', [])

.controller('GameCtrl', function ($scope) {})

.controller('PointsCtrl', function ($scope) {})

.controller('ChallengesCtrl', function ($scope, $ionicScrollDelegate) {
	$scope.filter = {
		open: false,
		toggle: function () {
			this.open = !this.open;
			if (this.open) {
				$ionicScrollDelegate.resize();
			}
		},
		filterBy: function (selection) {
			if (this.selected !== selection) {
				this.selected = selection;
				this.filter(selection);
			}
			this.toggle();
		},
		filter: function (selection) {},
		options: [],
		selected: null
	};

	$scope.filter.options = ['active', 'old'];
	$scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;

	$scope.filter.filter = function (selection) {
		console.log('selection: ' + selection);
	};

	$scope.filter.filter($scope.filter.selected);
})

.controller('RankingsCtrl', function ($scope) {})
