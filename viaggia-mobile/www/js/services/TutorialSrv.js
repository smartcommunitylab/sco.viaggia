angular.module('viaggia.services.tutorial', [])
.factory('tutorial', function (Config, $ionicPopup, $ionicModal, $translate, $filter, Utils) {

    var tutorial = {};

    var initTutorial = function(tutorialId, folder, total, $scope) {
        $scope.tutorialImageSrc = '';
        $scope.tutorialShowReorder = false;
        $scope.tutorialIndex = 1;
        $scope.tutorialSteps = total;
        $scope.tutorialDone = false;
        $scope.tutorialLang = ($translate.use()!='it'||'en')? 'en':$translate.use();
        $scope.tutorialFolder = folder;
        $scope.tutorialId = tutorialId;

        // function to show next tutorial page
        $scope.nextStep = function () {
            if ($scope.tutorialIndex < $scope.tutorialSteps) {
                $scope.tutorialIndex = $scope.tutorialIndex + 1;
                if ($scope.tutorialIndex == $scope.tutorialSteps) {
                    $scope.tutorialDone = true;
                }
                showImage($scope);
            } else {
                $scope.closeTutorial();
            }
        }
        // function to close tutorial
        $scope.closeTutorial = function () {
            $scope.tutorialModal.hide();
            setTutorialState($scope.tutorialId, true);
            if (window.cordova && window.cordova.plugins.screenorientation) {
               unlockOrientation = screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation || (screen.orientation && screen.orientation.unlock);
               unlockOrientation();
            }
            
        }

    }

    var getTutorialState = function(tutorialId) {
      return window.localStorage.getItem(Config.getAppId() + '_'  +tutorialId + '_tutorialDone');

    }
    var setTutorialState = function(tutorialId, state) {
      window.localStorage.setItem(Config.getAppId() + '_'  +tutorialId + '_tutorialDone', state);
    }

    var doTutorial = function(tutorialId) {
        var ls = getTutorialState(tutorialId);
        if (!ls || ls == 'false') {
            return true;
        } else {
            return false;
        }
    }

    tutorial.showTutorial = function (tutorialId, folder, total, $scope, force) {
        if (force) {
          setTutorialState(tutorialId, false);
        }
        if (doTutorial(tutorialId)) {
            if (window.cordova && window.cordova.plugins.screenorientation) {
                locOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || screen.orientation.lock;
locOrientation('portrait');
                // screen.lockOrientation('portrait');
            }

            $ionicModal.fromTemplateUrl('templates/tutorial.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                initTutorial(tutorialId, folder, total, $scope);
                $scope.tutorialModal = modal;
                showImage($scope);
                modal.show();
            });
        }
        //return true;
    }

    var showImage = function ($scope) {
        $scope.imageSrc = 'img/'+$scope.tutorialFolder+'/step_' + $scope.tutorialIndex + '_' + $scope.tutorialLang + '.png';

    }
    return tutorial;
})
