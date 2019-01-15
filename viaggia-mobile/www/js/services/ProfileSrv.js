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

    var status = {};
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
    profileService.getAvatarUrl = function () {
      return 'https://tn.smartcommunitylab.it/core.mobility/gamificationweb/player/avatar/' + Config.getAppId() + '/';
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
            url: Config.getServerURL() + '/gamificationweb/player/avatar/'+Config.getAppId()+'/'+profileId,
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
    profileService.setProfileStatus = function (status) {
      this.status = status;

    }
    profileService.getProfileStatus = function () {
      return this.status;
    }
    
    profileService.setProfileImage = function (file) {
      var deferred = $q.defer();
      var fd = new FormData();
      //Take the first selected file
      fd.append("data", file);
      LoginService.getValidAACtoken().then(
        function (token) {
          $http.post(Config.getServerURL() + '/gamificationweb/player/avatar', fd, {
            withCredentials: true,
            headers: {
              'Content-Type': undefined,
              'Authorization': 'Bearer ' + token,
              'appId': Config.getAppId(),
            },
            transformRequest: angular.identity
          }).success(function () {
            deferred.resolve();
          }).error(function (error) {
            deferred.reject(error);
          })
        });
      return deferred.promise;
    }
    return profileService;
  })
