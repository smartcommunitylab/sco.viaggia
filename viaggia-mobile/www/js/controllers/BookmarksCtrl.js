angular.module('viaggia.controllers.bookmarks', [])

/*
Controller that manages the bookmars' page : deleting, toggling and data.
Here it is managed also the tutorial for the page
*/

.controller('BookmarksCtrl', function ($scope, $location, $filter, $ionicHistory, $timeout, $ionicModal, $ionicListDelegate, Config, bookmarkService) {
  $scope.languageTutorial = "en";

  var init = function () {
    Config.init().then(function () {
      bookmarkService.getBookmarks().then(function (list) {
        $scope.bookmarks = list;
      });
    });
    initTutorial();
    setLanguageTutorial();

  };

  $scope.$on('ngLastRepeat.bookmarks', function (e) {
    $timeout(function () {
      ionicMaterialMotion.ripple();
      ionicMaterialInk.displayEffect()
    }); // No timeout delay necessary.
  });

  //remove the bookmark from storage and refresh list
  $scope.delete = function (idx, $event) {
    $scope.deleting = true;
    Config.loading();
    $event.preventDefault();
    bookmarkService.removeBookmark(idx).then(function (list) {
      $scope.bookmarks = list;
      $ionicHistory.clearCache();
      $ionicListDelegate.closeOptionButtons();
      Config.loaded();
    });
  };

  //remove the bookomark from the home page
  $scope.toggleHome = function (idx) {
    Config.loading();
    bookmarkService.toggleHome(idx).then(function (list) {
      $scope.bookmarks = list;
      $ionicHistory.clearCache();
      Config.loaded();
    });
  };

  //change the order of the bookmark from "from" position to "to"
  $scope.reorder = function (from, to) {
    Config.loading();
    bookmarkService.reorderBookmark(from, to).then(function (list) {
      $scope.bookmarks = list;
      $ionicHistory.clearCache();
      Config.loaded();
    });
  };

  $scope.toggleReorder = function () {
    $scope.showReorder = !$scope.showReorder;
  }

  //change page to state
  $scope.go = function (state) {
    if ($scope.deleting) {
      $scope.deleting = false;
    } else {
      $location.path(state);
    }
  }

  //show the tutorial in the modal view
  $scope.openModal = function () {
    $scope.modal.show();
  };

  //close the tutorial hiding the view
  $scope.closeModal = function () {
    $scope.modal.hide();
  };

  //init some usefull variables like starting index or if I reached the end of it
  function initTutorial() {
    $scope.imageSrc = '';
    $scope.showReorder = false;
    $scope.tutorialIndex = 1;
    $scope.stepTutorial = 2;
    $scope.endTutorial = false;

  }

  function setLanguageTutorial() {
    if (typeof navigator.globalization !== "undefined") {
      navigator.globalization.getPreferredLanguage(function (language) {
        $scope.languageTutorial = language.value.split("-")[0];
      }, null);
    }
  }

  //check if it is the first time I enter in the tutorial page or not
  function doTutorial() {
    if (!window.localStorage.getItem(Config.getAppId() + '_tutorialDone') || window.localStorage.getItem(Config.getAppId() + '_tutorialDone') == 'false') {
      return true;
    } else {
      return false;
    }
  }

  //force the tutorial when the question mark it is pressed
  $scope.forceTutorial = function () {
    window.localStorage.setItem(Config.getAppId() + '_tutorialDone', false);
    $scope.showTutorial();

  }

  //create and open the tutorial
  $scope.showTutorial = function () {
    if (doTutorial()) {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.screenorientation) {
        window.cordova.plugins.screenorientation.setOrientation('portrait');
      }

      $ionicModal.fromTemplateUrl('templates/bookmarkstutorial.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        initTutorial();
        $scope.showImage($scope.tutorialIndex);
        $scope.openModal();
      });
    }
    //return true;
  }
  $scope.closeTutorial = function () {
    $scope.closeModal();
    if (window.cordova && window.cordova.plugins.screenorientation) {
      screen.unlockOrientation()
    }
    window.localStorage.setItem(Config.getAppId() + '_tutorialDone', true);
  }

  //get the next step the the tutorial
  $scope.nextStep = function () {
    if ($scope.tutorialIndex < $scope.stepTutorial) {
      $scope.tutorialIndex = $scope.tutorialIndex + 1;
      if ($scope.tutorialIndex == $scope.stepTutorial) {
        $scope.endTutorial = true;
      }
      $scope.showImage($scope.tutorialIndex);
    } else {
      $scope.closeTutorial();
    }
  }
  $scope.showImage = function (index) {
    $scope.imageSrc = 'img/bookmarks/step_' + index + '_' + $scope.languageTutorial + '.png';

  }
  init();
})
