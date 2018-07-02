angular.module('viaggia.services.profile', [])
  /*

  Services that manages the profile's data like accessibility selection and tt size

  */

  .factory('profileService', function (Config, $q, $http, LoginService) {
    var profileService = {};
    var PROFILE_ACC = "_accesibility";
    var PROFILE_TABLE_SIZE = "_table_size";
    var PROFILE_TABLE_BIG_SIZE = "table_big_size";
    var PROFILE_TABLE_LITTLE_SIZE = "table_little_size";

    profileService.setTableBigSize = function () {
      profileService.setTableSize(PROFILE_TABLE_BIG_SIZE);
    }
    profileService.setTableLittleSize = function () {
      profileService.setTableSize(PROFILE_TABLE_LITTLE_SIZE);
    }
    profileService.setTableSize = function (size) {
      localStorage.setItem(Config.getAppId() + PROFILE_TABLE_SIZE, size);
    };
    profileService.isLittleSize = function () {
      if (profileService.getTableSize() === PROFILE_TABLE_BIG_SIZE) {
        return false;
      }
      return true;
    }
    profileService.getTableSize = function () {
      return localStorage.getItem(Config.getAppId() + PROFILE_TABLE_SIZE);
    };
    profileService.setAccessibility = function (acc) {
      localStorage.setItem(Config.getAppId() + PROFILE_ACC, acc);
    };
    profileService.getAccessibility = function () {
      return JSON.parse(localStorage.getItem(Config.getAppId() + PROFILE_ACC));
    };
    profileService.getProfileImage = function (profileId) {
      var deferred = $q.defer();
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'GET',
            url: Config.getServerURL() + '/gamificationweb/player/avatar/' + profileId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.getAppId(),
            },
            timeout: Config.getHTTPConfig().timeout
          })
            .success(function (detail) {
              deferred.resolve(detail);
            })

            .error(function (response) {
              deferred.reject(response);
            });
        });
      return deferred.promise;
    }

    profileService.setProfileImage = function (multipartImage) {
      var deferred = $q.defer();
      LoginService.getValidAACtoken().then(
        function (token) {
          $http({
            method: 'POST',
            url: Config.getServerURL() + '/gamificationweb/player/avatar/' + profileId,
            headers: {
              'Authorization': 'Bearer ' + token,
              'appId': Config.getAppId(),
            },
            data: multipartImage,
            timeout: Config.getHTTPConfig().timeout
          })
            .success(function (detail) {
              deferred.resolve(detail);
            })

            .error(function (response) {
              deferred.reject(response);
            });
        });
      return deferred.promise;
    }
    return profileService;
  })
