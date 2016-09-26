angular.module('viaggia.services.profile', [])

.factory('profileService', function (Config) {
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
    return profileService;
})
