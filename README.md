# Spotify Artist Tracks
demo: http://karneasada.github.io/artist-search/

A very simple app that allows the user to search for an artist, via Spotify's Web API. Each search returns a list of potential matches. Clicking on an artist's name returns a list of that artist's top ten most popular tracks. A preview of each track is also playable by clicking on the track's name.

# Just Plain JavaScript
This entire app is built without the use of plugins or libraries - only plain ES5. I built some helper objects to stand in for the type of tools I would have if I had used a framework like Angular.

## Promises
I wrote an object called ```Vow``` that uses the promise pattern based on the Promise/A+ spec. It's *thenable* and has resolve and reject methods.

I used it to wrap AJAX calls to the Spotify API, like so:
```
ajax('https://api.spotify.com/v1/search?q=search&type=artist&market=US').then(
   function(data){
     // do something with response
   },
   function(err) {
     // Handle error
   }
);
```

## Binding via the Observer Pattern
I created a simple ```ObservableArray``` object that I used to store the results of the ajax calls and update the view. This allowed me to create a simple MVC system - in which the ```ObservableArray``` objects were the models. 

An example instantiation:
```
var oArray = new ObservableArray([], function(){
  // Do something with the array, accessed as "this"
});

```

## Routing
I setup a ```Router``` object that used the hash value of the url to trigger state changes. The router accepted routes in a regular expression format and allowed on parathesized parameter, that would be passed to the route's controller. The router also has a convenience function, ```Router.go``` that can be used to change the url hash value.

These are the routes used in the app:
```
var router = new Router({
        '/search/(\\w+)': searchForArtist,
        '/artist/[^/]+/(\\w+)': getArtistsTopTracks
      });
```



