angular.module('viaggia.controllers.common', [])

	.controller('AppCtrl', function ($scope, $state, $rootScope, $location, $timeout, $ionicScrollDelegate, $ionicPopup, $ionicModal, $filter, $ionicLoading, DataManager, Config, planService, Utils, tutorial) {
		/* menu group */
		$scope.shownGroup = false;
		$scope.toggleGroupRealTime = function () {
			if ($scope.isGroupRealTimeShown()) {
				$scope.shownGroup = false;
			} else {
				$scope.shownGroup = true;
			}
			localStorage.setItem(Config.getAppId() + '_shownGroup', $scope.shownGroup);
		};

		$scope.isGroupRealTimeShown = function () {
			return $scope.shownGroup === true;
		};
		$scope.isAccessibilitySet = function () {
			return Config.getAccessibility();
		}

		$ionicModal.fromTemplateUrl('templates/credits.html', {
			id: '3',
			scope: $scope,
			backdropClickToClose: false,
			animation: 'slide-in-up'
		}).then(function (modal) {
			$scope.creditsModal = modal;
		});

		$scope.closeCredits = function () {
			$scope.creditsModal.hide();
		};

		$scope.openCredits = function () {
			$scope.creditsModal.show();
		};

		$scope.openGamificationBoard = function () {
			//$scope.firstOpenPopup.close();
			$state.go('app.game');
		};
		$scope.openBadgeBoard = function () {
			//$scope.firstOpenPopup.close();
			$state.go('app.game.points');
		};
		$scope.planFromPopup = function () {
			$scope.closePopup();
			$scope.newPlan();
		};

		$scope.myTripsFromPopup = function () {
			$scope.closePopup();
			$state.go('app.mytrips');
		};

		$scope.openRules = function () {
			if (!!$scope.firstOpenPopup) {
				$scope.firstOpenPopup.close();
			}

			$scope.openRulesModal();

		};

		$scope.openExtLink = function (link) {
			window.open(link, "_system", "location=yes");
		}

		$scope.openPrizes = function () {
			if (!!$scope.firstOpenPopup) {
				$scope.firstOpenPopup.close();
			}
			var url = Config.getGamificationURL() + "/view_prizes";
			window.open(url, "_system", "location=yes");
		};

		$scope.forceTutorial = function () {
			if (!!$scope.firstOpenPopup) {
				$scope.firstOpenPopup.close();
			}
			tutorial.showTutorial('main', 'main', 4, $scope, true);
		}

		$scope.closePopup = function () {
			$scope.firstOpenPopup.close();
		};

		$scope.showPlayAndGoPopup = function () {
			$state.go('app.gamemenu');

			//        $scope.firstOpenPopup = $ionicPopup.show({
			//            templateUrl: 'templates/welcomePopup.html',
			//            title: $filter('translate')('lbl_betatesting'),
			//            cssClass: 'parking-popup',
			//            scope: $scope
			//        });
		};


		$scope.openPlan = function () {
			$state.go('app.plan');
		};

		$scope.openTT = function () {
			$state.go('app.ttlist')
		}

		$scope.openDiary = function () {
			$state.go('app.diary');
		};

		$scope.openStatistics = function () {
			$state.go('app.statistics')
		};

		$scope.newPlan = function () {
			planService.setPlanConfigure(null);
			$state.go('app.plan');
		};

		/* pop up managers */
		/*
		$scope.newPlan = function () {
			planService.setTripId(null); //reset data for pianification
			$state.go('app.plan');
		};
		*/

		$scope.popupLoadingShow = function () {
			$ionicLoading.show({
				template: $filter('translate')("pop_up_loading")
			});
		};

		$scope.popupLoadingHide = function () {
			$ionicLoading.hide();
		};

		$scope.showConfirm = function (template, title, functionOnTap) {
			var confirmPopup = $ionicPopup.confirm({
				title: title,
				template: template,
				buttons: [
					{
						text: $filter('translate')("pop_up_cancel"),
						type: 'button-cancel'
					},
					{
						text: $filter('translate')("pop_up_ok"),
						type: 'button-custom',
						onTap: functionOnTap
					}
				]
			});
		};

		$scope.showNoConnection = function () {
			var alertPopup = $ionicPopup.alert({
				title: $filter('translate')("pop_up_no_connection_title"),
				template: $filter('translate')("pop_up__no_connection_template"),
				buttons: [
					{
						text: $filter('translate')("pop_up_ok"),
						type: 'button-custom'
					}
				]
			});
		};

		$scope.getRecurrentDays = function (recurrency) {
			var returnDays = [];
			var empty_rec = Config.getDaysRec()
			for (var k = 0; k < empty_rec.length; k++) {
				if (Utils.contains(recurrency.daysOfWeek, k + 1)) {
					returnDays.push(empty_rec[k]);
				}
			}
			return returnDays;
		};

		$scope.getNotificationTypes = function () {
			var returnNotificationsTypes = [];
			var notifTypes = Config.getNotifTypes()
			for (var k = 0; k < notifTypes.length; k++) {
				returnNotificationsTypes.push(notifTypes[k]);
			}
			return returnNotificationsTypes;
		};

		$scope.openModal = function () {
			$scope.modal.show();
		};

		$scope.hideExpandRulesButton = function () {
			if (!$scope.expandedRules) {
				return false;
			}
			return true;
		};

		$scope.hideCloseRulesButton = function () {
			if ($scope.expandedRules) {
				return false;
			}
			return true;
		};

		$scope.closeModal = function () {
			$scope.modal.hide();
		};

		$scope.openRulesModal = function () {
			$scope.lang = Config.getLang();
			$ionicModal.fromTemplateUrl('templates/rulesModal.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function (modal) {
				$scope.modal = modal;
				$scope.openModal();
			});
		};

		$scope.scrollTo = function (id) {
			$location.hash(id)
			$ionicScrollDelegate.anchorScroll(true);
		};

		$scope.toggleRules = function () {
			if ($scope.isLongRulesShown()) {
				$scope.expandedRules = false;
				//$scope.scrollTo("firstSeparator");
			} else {
				$scope.expandedRules = true;

			}
		};

		$scope.isLongRulesShown = function () {
			return $scope.expandedRules;
		};

		$scope.showErrorServer = function () {
			var alertPopup = $ionicPopup.alert({
				title: $filter('translate')("pop_up_error_server_title"),
				template: $filter('translate')("pop_up_error_server_template"),
				buttons: [
					{
						text: $filter('translate')("pop_up_ok"),
						type: 'button-custom'
					}
				]
			});
		};

		Config.init().then(function () {
			$scope.infomenu = Config.getInfoMenu();
			$scope.version = Config.getVersion();
			$scope.shownGroup = JSON.parse(localStorage.getItem(Config.getAppId() + '_shownGroup')) || false;
			$scope.contactLink = Config.getContactLink();
			$scope.taxiEnabled = (Config.getTaxiId() != 'undefined');
		});

		$scope.selectInfomenu = function (m) {
			//      m.data.label = m.label;
			//      Config.setInfoMenuParams(m.data);
			//      $state.go(m.state);
		};
	})

	.factory('Toast', function ($rootScope, $timeout, $ionicPopup, $cordovaToast) {
		return {
			show: function (message, duration, position) {
				message = message || "There was a problem...";
				duration = duration || 'short';
				position = position || 'top';

				if (!!window.cordova) {
					// Use the Cordova Toast plugin
					$cordovaToast.show(message, duration, position);
				} else {
					if (duration == 'short') {
						duration = 2000;
					} else {
						duration = 5000;
					}

					var myPopup = $ionicPopup.show({
						template: "<div class='toast'>" + message + "</div>",
						scope: $rootScope,
						buttons: []
					});

					$timeout(function () {
						myPopup.close();
					}, duration);
				}
			}
		};
	})

	.factory('Utils', function ($rootScope, $timeout, $ionicPopup, $cordovaToast) {
		return {
			contains: function (a, obj) {
				for (var i = 0; i < a.length; i++) {
					if (a[i] === obj) {
						return true;
					}
				}
				return false;
			}
		};
	})

	.controller('TutorialCtrl', function ($scope, $ionicLoading) { });
