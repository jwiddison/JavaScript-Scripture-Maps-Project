// function initMap() {
//   var jerusalem = {lat: 31.7683, lng: 35.2137};
//   var map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 9,
//     center: jerusalem
//   });
// }
//
// function showLocation(geotagId, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
//   var location = {lat: latitude, lng: longitude};
//   var map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 7,
//     center: location
//   });
//   var marker = new google.maps.Marker({
//     position: location,
//     map: map,
//     label: placename
//   });
// }


// Relationship between zoom level and altitude:
/*
  Ratio is about 500:1.  Divide altitude by 500 to get the Zoom level you want to use.
*/

// OnCrossFade is a good place to try and get all the a[onclick^='showLocation']

// fitBounds() is a good way to show all markers.  Check the stack overflow.

// <a href="javascript:void(0);" onclick="showLocation(108,'Assyria',36.359410,43.152887,33.515336,44.551217,0.000000,0.000000,1202300.000000,0.000000,'>')">Assyria</a>
