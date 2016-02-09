angular.module('viaggia.controllers.bookmarks', [])

.controller('BookmarksCtrl', function ($scope, $location, $filter, $ionicHistory, $timeout, $ionicModal, $ionicListDelegate, Config, bookmarkService) {

    $scope.languageTutorial = "en";

    function initTutorial() {
        $scope.showReorder = false;
        $scope.tutorialIndex = 1;
        $scope.stepTutorial = 2;
        $scope.endTutorial = false;
    }


    var init = function () {
        Config.init().then(function () {
            bookmarkService.getBookmarks().then(function (list) {
                $scope.bookmarks = list;
            });
        });
        initTutorial();
        setLanguageTutorial();

    };

    function setLanguageTutorial() {
        if (typeof navigator.globalization !== "undefined") {
            navigator.globalization.getPreferredLanguage(function (language) {
                $scope.languageTutorial = language.value.split("-")[0];
            }, null);
        }
    }

    function doTutorial() {
        //check if present window storage
        if (!window.localStorage.getItem('tutorialDone') || window.localStorage.getItem('tutorialDone') == 'false') {
            return true;
        } else {
            return false;
        }
    }

    $scope.forceTutorial = function () {
        window.localStorage.setItem('tutorialDone', false);
        $scope.showTutorial();

    }
    $scope.showTutorial = function () {
        if (doTutorial()) {
            if (window.cordova && window.cordova.plugins.screenorientation) {
                screen.lockOrientation('portrait');
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
        window.localStorage.setItem('tutorialDone', true);
    }
    $scope.$on('ngLastRepeat.bookmarks', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });

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
    $scope.toggleHome = function (idx) {
        Config.loading();
        bookmarkService.toggleHome(idx).then(function (list) {
            $scope.bookmarks = list;
            $ionicHistory.clearCache();
            Config.loaded();
        });
    };
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

    $scope.go = function (state) {
        if ($scope.deleting) {
            $scope.deleting = false;
        } else {
            $location.path(state);
        }
    }



    $scope.openModal = function () {
        $scope.modal.show();
    };

    $scope.closeModal = function () {
        $scope.modal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hide', function () {
        // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function () {
        // Execute action
    });
    $scope.$on('modal.shown', function () {
        console.log('Modal is shown!');
    });

    $scope.imageSrc = 'img/bookmarks/tutorial1.png';
    $scope.nextStep = function () {
        if ($scope.tutorialIndex < $scope.stepTutorial) {
            $scope.tutorialIndex = $scope.tutorialIndex + 1;
            if ($scope.tutorialIndex == $scope.stepTutorial) {
                $scope.endTutorial = true;
            }
            $scope.showImage($scope.tutorialIndex);
        } else {
            $scope.closeModal();
        }
    }
    $scope.showImage = function (index) {
        switch (index) {
        case 1:
            $scope.imageSrc = 'img/bookmarks/step_01_' + $scope.languageTutorial + '.png';
            break;
        case 2:
            $scope.imageSrc = 'img/bookmarks/step_02_' + $scope.languageTutorial + '.png';
            break;

        }
        //$scope.openModal();
    }
    init();
})
