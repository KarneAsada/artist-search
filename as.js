(function(document, undefined){

  var AS = {
    artists: null,
    tracks: null;
    init: function() {
      // Setup arrays
      var artistList = document.getElementById('artistList');
      AS.artists = new ObservableArray([], function(){
        artistList.innerHTML = '';
        this.value.forEach(function(artist){
          var elm = document.createElement('div');
          elm.className = 'col-xs-12';
          elm.textContent = artist.name;
          elm.addEventListener('click', function(){
            AS.getArtistsTopTracks(artist.id);
          });
          artistList.appendChild( elm );
        });
        console.log('Updating artists list');
        console.log(this.value);
      });

      AS.start();
    },
    start: function() {
      // test ajax
      ajax('search.json').then(
         function(data){
           AS.artists.update(data.artists.items);
         },
         function(err) {
           console.log('Failed to load ajax');
           console.log(err);
         }
      );
    },

    getArtistsTopTracks: function(id) {
      ajax('https://api.spotify.com/v1/artists/'+artist.id+'/top-tracks?country=US').then(
        function(data) {
          console.log('top tracks');
          console.log(data);
        },
        function(err) {

        }
      );
    }
  };


  // Promise
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
    console.log('then');
    console.log(this.callbacks);
    return this;
  };

  Vow.prototype.resolve = function() {
    var callback = this.callbacks.shift();
    if (callback && callback.resolve) {
      callback.resolve.apply(this, arguments);
    }
  };

  Vow.prototype.reject = function() {
    console.log('reject func');
    var callback = this.callbacks.shift();
    console.log(callback);
    if (callback && callback.reject) {
      callback.reject.apply(this, arguments);
    }
  };

  // AJAX
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

  /**
   *
   */

  function ObservableArray( initial, onUpdate ) {
    this.value = initial || [];
    this.notify = onUpdate;
  }

  ObservableArray.prototype.update = function(newValue) {
    this.value = newValue;
    this.notify.call(this);
  };



  function doWhenReady( func ) {
    var execute = (function(func) {
                    return function() { doWhenReady(func); };
                  })(func);
    /in/.test(document.readyState)?setTimeout(execute,99):func();
  }



  doWhenReady( AS.init );

})(document);
