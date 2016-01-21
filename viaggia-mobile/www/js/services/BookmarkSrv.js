angular.module('viaggia.services.bookmarks', [])

.factory('bookmarkService', function ($q, $rootScope, Config) {
  var repo = '';
  Config.init().then(function(){
    repo = Config.getAppId()+'_bookmarks';
  });

  var getStoredBookmarks = function() {
    var value = localStorage.getItem(repo);
    if (!value) {
      value = [];
    } else {
      value = JSON.parse(value);
    }
    return value;
  };
  var getDefaultBookmarks = function() {
    return angular.copy(Config.getPrimaryLinks());
  };
  var getBookmarks = function() {
      if (!localStorage.getItem(repo)) {
        var defList = getDefaultBookmarks();
        defList.forEach(function(e) {e.home = true;});
        localStorage.setItem(repo, JSON.stringify(defList));
      }
      return getStoredBookmarks();
  };

  $rootScope.getBookmarkItemTemplate = function(type) {
        switch(type) {
          case 'TRAINSTOP':
          case 'BUSSTOP':
          case 'BUSSUBURBANSTOP': {
            return 'templates/bm/stop.html';
            break;
          }
          case 'TRAIN':
          case 'BUS':
          case 'BUSSUBURBAN': {
            return 'templates/bm/line.html';
          }
          case 'PARKING': {
            return 'templates/bm/parking.html';
          }
          case 'BIKESHARING': {
            return 'templates/bm/bikesharing.html';
          }
          case 'TRIP': {
            return 'templates/bm/trip.html';
          }
          default:
            return 'templates/bm/default.html';
        }
  }


  return {
    /**
     * add bookmark to the list. Return promise of the update bookmark list
     */
    addBookmark: function(bm) {
      var deferred = $q.defer();

      var list = getBookmarks();
      bm.home = true;
      bm.removable = true;
      list.splice(0,0,bm);
      localStorage.setItem(repo, JSON.stringify(list));
      deferred.resolve(list);

      return deferred.promise;
    },
    /**
     * Return promise of current list of bookmarks. Initially, set to the list of predefined bookmarks from the configuration (cannot be removed permanently).
     */
    getBookmarks: function() {
      var deferred = $q.defer();
      deferred.resolve(getBookmarks());
      return deferred.promise;
    },
    /**
     * Return position of the bookmark with the specified path in the list.
     */
    indexOfBookmark: function(bm) {
      var list = getBookmarks();
      for (var i = 0; i < list.length; i++) {
        if (bm == list[i].state) return i;
      }
      return -1;
    },
    /**
     * Remove the bookmark at the specified index from the list (if possible). Return promise of the update bookmark list
     */
    removeBookmark : function(idx) {
      var deferred = $q.defer();
      var list = getBookmarks();
      if (list.length > idx && list[idx].removable) {
        list.splice(idx,1);
        localStorage.setItem(repo, JSON.stringify(list));
      }
      deferred.resolve(list);

      return deferred.promise;
    },
    /**
     * Add/remove the bookmark to/from the home page. Return promise of the update bookmark list
     */
    toggleHome : function(idx) {
      var deferred = $q.defer();
      var list = getBookmarks();
      list[idx].home = !list[idx].home;
      localStorage.setItem(repo, JSON.stringify(list));
      deferred.resolve(list);

      return deferred.promise;
    },
    /**
     * Change order of two bookmarks. Return promise of the update bookmark list
     */
    reorderBookmark: function(idxFrom, idxTo) {
      var deferred = $q.defer();

      var list = getBookmarks();
      var from = list[idxFrom];
      list.splice(idxFrom, 1);
      if (idxFrom > idxTo) {
        list.splice(idxTo - 1, 0, from);
      } else {
        list.splice(idxTo, 0, from);
      }
      localStorage.setItem(repo, JSON.stringify(list));
      deferred.resolve(list);

      return deferred.promise;
    },
    /**
     * Return the style of the bookmark button for the element
     */
    getBookmarkStyle: function(bm) {
      return this.indexOfBookmark(bm) >= 0 ? 'ic_bookmark' : 'ic_bookmark-outline';
    },
    /**
     * Add/remove a bookmark for the element of the specified type, path, and title. Returns promise for the update style.
     */
    toggleBookmark: function(path, title, type) {
      var deferred = $q.defer();
      var pos = this.indexOfBookmark(path);
      if (pos >= 0) {
        this.removeBookmark(pos).then(function() {
          deferred.resolve('ic_bookmark-outline');
        });
      } else {
        var color = null, icon = null;

        switch(type) {
          case 'TRAIN': {
            var ct = Config.getColorsTypes()[type];
            color = ct.color;
            icon = 'ic_train';
            break;
          }
          case 'BUS': {
            var ct = Config.getColorsTypes()[type];
            color = ct.color;
            icon = 'ic_urban-bus';
            break;
          }
          case 'BUSSUBURBAN': {
            var ct = Config.getColorsTypes()[type];
            color = ct.color;
            icon = 'ic_extraurban-bus';
            break;
          }
          case 'TRAINSTOP': {
            var ct = Config.getColorsTypes()['TRAIN'];
            color = ct.color;
            icon = 'ic_m_train';
            break;
          }
          case 'BUSSTOP': {
            var ct = Config.getColorsTypes()['BUS'];
            color = ct.color;
            icon = 'ic_m_urban_bus';
            break;
          }
          case 'BUSSUBURBANSTOP': {
            var ct = Config.getColorsTypes()['BUSSUBURNAN'];
            color = ct.color;
            icon = 'ic_m_extraurban_bus';
            break;
          }
          case 'PARKING': {
            var ct = Config.getColorsTypes()['PARKING'];
            color = ct.color;
            icon = 'ic_m_parking-lot';
            break;
          }
          case 'BIKESHARING': {
            var ct = Config.getColorsTypes()['BIKESHARING'];
            color = ct.color;
            icon = 'ic_m_bike';
            break;
          }
          case 'TRIP': {
            var ct = Config.getColorsTypes()['TRIP'];
            color = ct.color;
            icon = 'ic_folder';
            break;
          }
        }

        this.addBookmark({"state":path,"label": title, "icon": icon, "color": color, type: type}).then(function() {
          deferred.resolve('ic_bookmark');
        });
      }
      return deferred.promise;
    }
  };
})
