angular.module('viaggia.controllers.common', [])

  .controller('AppCtrl', function ($scope, $q, $state, $rootScope, trackService, $ionicHistory, $location, $timeout, $ionicScrollDelegate, $ionicPopup, $ionicModal, $filter, $ionicLoading, DataManager, Config, planService, Utils, tutorial) {


    /* menu group */
    $scope.shownGroup = false;
    $scope.progressCounter = {
      walk: 0,
      bike: 0,
      bus: 0,
      train: 0
    };

    $scope.maxvalues = {
      maxDailywalk: 10000,
      maxDailybike: 20000,
      maxDailybus: 50000,
      maxDailytrain: 50000
    }
        $scope.progressPercent = {
            walk: 0,
            bike: 0,
            bus: 0,
            train: 0
        };
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

    // playGo group
    $scope.shownPlayGroup = false;
    $scope.toggleGroupPlayGo = function () {
      if ($scope.isGroupPlayGoShown()) {
        $scope.shownPlayGroup = false;
      } else {
        $scope.shownPlayGroup = true;
      }
      localStorage.setItem(Config.getAppId() + '_shownPlayGroup', $scope.shownPlayGroup);
    };
    $scope.openProfileOthers = function (profile) {
      $state.go('app.profileOthers', {
        profileId: profile.playerId
      });
    }
    $scope.openProfile = function () {
      $state.go('app.profile');
    }
    $scope.isGroupPlayGoShown = function () {
      return $scope.shownPlayGroup === true;
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
    $scope.goBackView = function () {
      var backView = $ionicHistory.backView();
      if (backView) {
        $ionicHistory.goBack();
      } else {
        $state.go('app.home.home');
        $ionicHistory.nextViewOptions({
          disableBack: true,
          historyRoot: true
        });
      }
    }
    $scope.buttonMapNeed = function () {
      //if tracking is going on and I'm not in the map page show it
      if ($state.current.name != "app.mapTracking" && $state.current.name != "app.login" && trackService.trackingIsGoingOn() && !trackService.trackingIsFinished())
        return true;
      return false
    }
    $scope.isHomePages = function () {
      if ($state.current.name === "app.home.home" || $state.current.name === "app.home.leaderboards" || $state.current.name === "app.home.diary" || $state.current.name === "app.home.mobility")
        return true;
      return false;
    }
    $scope.goToMap = function () {
      $state.go('app.mapTracking');
      $ionicHistory.nextViewOptions({
        disableBack: true,
        historyRoot: false
      });

    }
    $scope.goHome = function () {
      $state.go('app.home.home');
      $ionicHistory.nextViewOptions({
        disableBack: true,
        historyRoot: true
      });
    }

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


    $scope.openFAQ = function () {
      if (!!$scope.firstOpenPopup) {
        $scope.firstOpenPopup.close();
      }
      var url = Config.getGamificationURL() + "/faq";
      window.open(url, "_system", "location=yes");
    }
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
      var url = Config.getGamificationURL() + "/prizes";
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

      $ionicHistory.nextViewOptions({
        disableBack: true
      });
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
    $scope.actualTracking = function (type) {
      var tripId = localStorage.getItem(Config.getAppId() + '_tripId');
      if (tripId && tripId.startsWith(type))
        return true;
      return false;
    }
    $scope.getActualTracking = function () {
      var tripId = localStorage.getItem(Config.getAppId() + '_tripId');
      if (tripId)
        return tripId.substring(0, tripId.indexOf('_'));
      else return null;
    }

    $scope.updateBar = function (location) {
      //TODO best calculation over max 
      if (location.extras) {
        $scope.progressCounter[location.extras.transportType]++;
        $scope.progressPercent.walk = ($scope.progressCounter.walk * 20 / $scope.maxvalues.maxDailywalk) * 100;
        $scope.progressPercent.bike = ($scope.progressCounter.bike * 20 / $scope.maxvalues.maxDailybike) * 100;
        $scope.progressPercent.bus = ($scope.progressCounter.bus * 20 / $scope.maxvalues.maxDailybus) * 100;
        $scope.progressPercent.train = ($scope.progressCounter.train * 20 / $scope.maxvalues.maxDailytrain) * 100;
      }

    }
    $scope.isBatterySaveMode = function () {
      var deferred = $q.defer();
      BackgroundGeolocation.isPowerSaveMode(function (isPowerSaveMode) {
        if (isPowerSaveMode) {
          deferred.resolve(true);
        }
        else {
          deferred.resolve(false);
        }

      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    $scope.localizationAlwaysAllowed = function () {
      var deferred = $q.defer();
      cordova.plugins.diagnostic.getLocationAuthorizationStatus(function (status) {
        switch (status) {
          case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
            console.log("Permission not requested");
            deferred.resolve(true);
            break;
          case cordova.plugins.diagnostic.permissionStatus.DENIED:
            console.log("Permission denied");
            deferred.resolve(false);

            break;
          case cordova.plugins.diagnostic.permissionStatus.GRANTED:
            console.log("Permission granted always");
            deferred.resolve(true);

            break;
          case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
            console.log("Permission granted only when in use");
            deferred.resolve(false);

            break;
          case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
            console.log("Permission permanently denied");
            deferred.resolve(false);

            break;
        }
      }, function (error) {
        console.error("The following error occurred: " + error);
        deferred.reject();

      });
      return deferred.promise;
    }
    $scope.showSaveBatteryPopUp = function (goOn, transportType) {
      $ionicPopup.confirm({
        title: $filter('translate')("pop_up_battery_save"),
        template: $filter('translate')("pop_up_battery_save_template"),
        buttons: [
          {
            text: $filter('translate')("btn_close"),
            type: 'button-cancel'
          },
          {
            text: $filter('translate')("btn_start_tracking"),
            type: 'button-ok',
            onTap: function () {
              goOn(transportType);
            }
          }
        ]
      });

    }
    $scope.showWarningPopUp = function () {
      //show popup and
      $ionicPopup.confirm({
        title: $filter('translate')("pop_up_always_GPS"),
        template: $filter('translate')("pop_up_always_GPS_template"),
        buttons: [
          {
            text: $filter('translate')("btn_close"),
            type: 'button-cancel'
          },
          {
            text: $filter('translate')("pop_up_always_GPS_go_on"),
            type: 'button-custom',
            onTap: function () {
              if (device.platform == "iOS") {
                cordova.plugins.diagnostic.switchToSettings();
              }
              else {
                cordova.plugins.diagnostic.switchToLocationSettings();
              }
            }
          }
        ]
      });

    }

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
      $scope.playmenu = Config.getPlayMenu();
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
