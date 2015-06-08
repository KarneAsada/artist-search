(function(document, window, undefined){

  /**
   * Main Application Code
   */
  var AS = {
    artists: null,
    tracks:  null,
    router:  null,
    init: function() {

      // Setup ObservableArrays
      AS.artists = new ObservableArray([], AS.loadArtistResults);
      AS.tracks  = new ObservableArray([], AS.loadTopTracks);

      // Router
      AS.router = new Router({
        '/search/(\\w+)': AS.searchForArtist,
        '/artist/[^/]+/(\\w+)': AS.getArtistsTopTracks
      });

      // Add Listener to Search button
      var searchBtn  = document.getElementById('search');
      var queryInput = document.getElementById('query');
      searchBtn.addEventListener('click', function(){
        // Get search query
        var query = queryInput.value;
        if (query) {
          AS.router.go('/search/' + query);
        }
      });

      // Trigger button click when Enter is pressed
      queryInput.addEventListener('keypress', function(e) {
        if (e.keyCode == 13) {
          searchBtn.dispatchEvent(new Event('click'));
        }
      });

    },

    // Search Spotify artist API for keyword
    searchForArtist: function(search) {
      ajax('https://api.spotify.com/v1/search?q='+search+'&type=artist&market=US').then(
         function(data){
           AS.lastSearch = search;
           AS.artists.update(data.artists.items);
         },
         function(err) {
           log('Failed to load artist ajax');
         }
      );
    },

    // Display the list of artists returned from the API
    loadArtistResults: function(){
      log('Updating artists results');
      var artistList = document.getElementById('resultList');
      artistList.innerHTML = '';

      // Header
      var header = document.createElement('p');
      header.innerHTML = '<i class="fa fa-angle-double-right"></i> '
                       + 'Artists matching <i>'+AS.lastSearch+'</i>';
      header.className = 'col-xs-12';
      artistList.appendChild( header );

      // Iterate through artist array
      this.forEach(function(artist){
        var elm = document.createElement('div');
        elm.className = 'col-xs-12';
        elm.textContent = artist.name;
        elm.addEventListener('click', function(){
          AS.router.go('/artist/' + artist.name + '/' + artist.id);
        });
        artistList.appendChild( elm );
      });
    },

    // Query Spotify track API for specified track
    getArtistsTopTracks: function(id) {
      ajax('https://api.spotify.com/v1/artists/'+id+'/top-tracks?country=US').then(
        function(data) {
          AS.tracks.update(data.tracks);
        },
        function(err) {
          log('Failed to load track ajax');
        }
      );
    },

    // Display top ten tracks for specified artist
    loadTopTracks: function() {
      log('Loading top tracks');
      var resultList = document.getElementById('resultList');
      resultList.innerHTML = '';

      // Header
      var header = document.createElement('p');
      header.innerHTML = '<i class="fa fa-angle-double-right"></i> '
                       + 'top ten most popular tracks by <i>'
                       + this[0].artists[0].name
                       + '</i> <small>(Click to hear a preview)</small>';
      header.className = 'col-xs-12';
      resultList.appendChild( header );

      // Iterate through tracks
      this.forEach(function(track){
        var elm = document.createElement('div');
        elm.className = 'col-xs-12';
        elm.textContent = track.name;
        elm.preview_url = track.preview_url;
        elm.addEventListener('click', AS.playPauseTrack);
        resultList.appendChild( elm );
      });
    },

    // Play or pause track in HTML5 audio player
    playPauseTrack: function() {
      var audio = document.getElementById('audioPlayer');
      if (audio.src != this.preview_url) {
        log('playing: ' + this.preview_url);
        audio.src = this.preview_url;
        audio.play();
      } else {
        audio.src = '';
        audio.pause();
      }
    }
  };

  /**
   * Objects used in the app
   */

  // A promise pattern based on the Promises/A+ spec
  function Vow( promise ) {
    if (promise instanceof Vow) {
      return promise;
    } else {
      this.callbacks = [];
    }
  }

  Vow.prototype.then = function(resolve, reject) {
    this.callbacks.push({
      resolve: resolve,
      reject: reject
    });
    return this;
  };

  Vow.prototype.resolve = function() {
    var callback = this.callbacks.shift();
    if (callback && callback.resolve) {
      callback.resolve.apply(this, arguments);
    }
  };

  Vow.prototype.reject = function() {
    var callback = this.callbacks.shift();
    if (callback && callback.reject) {
      callback.reject.apply(this, arguments);
    }
  };

  // A "promisified" XMLHttpRequest object
  function ajax(url) {
    var vow = new Vow();
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function () {
      if (req.readyState != 4) {
        return;
      }
      if (req.readyState == 4 && req.status != 200) {
        vow.reject( req );
      } else {
        vow.resolve( JSON.parse(req.responseText) );
      }
    };
    req.send();
    return vow;
  }

  // A simple Observer pattern based on an Array
  // The array takes a callback that it notified when
  // the array is updated.
  function ObservableArray( initial, onUpdate ) {
    this.notify = onUpdate;
    Array.call(this, initial || []);
    Array.prototype.push.apply(this, initial);
  }

  ObservableArray.prototype = Object.create(Array.prototype);
  ObservableArray.prototype.constructor = ObservableArray;

  // Updates the array's value and triggers a callback
  ObservableArray.prototype.update = function(newValue) {
    this.splice(0, this.length);
    this.push.apply(this, newValue);
    this.notify.call(this);
  };

  // A simple routing tool. It takes an object whose keys
  // are routes in RegExp format and values that are callbacks.
  // The callbacks are passed the value of paranthesized parameters.
  function Router( routes ) {
    var self = this;
    self.routes = routes || {};

    // Initialize
    if (window.addEventListener) {
      window.addEventListener("hashchange", function(){
        self.hashChange()
      }, false);
    }
    else if (window.attachEvent) {
      window.attachEvent("onhashchange", function(){
        self.hashChange()
      });
    }
    self.hashChange();
  }

  // When the location hash is changed, check each stored route
  // for a match and fire the appropriate callback.
  Router.prototype.hashChange = function() {
    var hash = (window.location.hash || "#").slice(1);
    for (var route in this.routes) {
      if (this.routes.hasOwnProperty(route)) {
        var match = hash.match(route);
        if (match) {
          var param = match.length == 2 ? match[1] : undefined;
          log('Matched route: ' + route + (param ? ' => '+param : ''));
          return this.routes[route].call(this, param);
        }
      }
    }

    // Default route
    if (this.routes.default) {
      this.routes.default.call(this);
    }
  }

  // Convenience method to set the hash value
  Router.prototype.go = function( newLocation ) {
    window.location.hash = newLocation;
  }

  /**
   * Utility functions
   */

  // Function to delay execution until the DOM is ready
  function doWhenReady( func ) {
    var execute = (function(func) {
                    return function() { doWhenReady(func); };
                  })(func);
    /in/.test(document.readyState) ? setTimeout(execute,99) : func();
  }

  // Safe console.log function
  function log(msg) {
    if (window.console && window.console.log) {
      console.log(msg);
    }
  }

  // Bootstrap the application
  doWhenReady( AS.init );

})(document, window);
