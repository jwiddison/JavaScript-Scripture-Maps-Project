/*property
    ajax, animate, append, appendTo, bookByID, books, center, complete, css, dataType,
    duration, error, find, forEach, fullName, getElementById, gridName, hasOwnProperty, hash,
    html, id, init, lat, length, location, log, lng, Map, maps, maxBookId, minBookId, nextChapter,
    numChapters, onHashChanged, opacity, parentBookId, prevChapter, push,
    queue, remove, setTimeout, slice, split, substring, success, tocName, url,
    urlForScriptureChapter, volumes, zoom
*/


/*global $, Number, window, console */
/*jslint es6 browser: true*/

var map;
var markers = [];
var selected_placename;

// TODO: Fix this so that when you click on the suggestion button without having clicked a placename, it still works
$("#suggest_button").children().click(function() {
  console.log('AHHHHHHH');
  $("#place_name").val(window.getSelection().toString());
  $("#lat").val(map.getCenter());
  $("#view_lat").val(map.getCenter());
  $("#long").val(map.getCenter());
  $("#view_long").val(map.getCenter());
});

function initMap() {
  var jerusalem = {lat: 31.7683, lng: 35.2137};
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 9,
    center: jerusalem
  });
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

function getMarkersForChapter() {
  var counter = 0;
  $("a[onclick^='showLocation']").each(function(){
    var location = $(this).attr("onclick").split(",");
    var loc = {lat: Number(location[2]), lng: Number(location[3])}

    var marker = new google.maps.Marker({
      position: loc,
      map: map,
      label: location[1].replace(/'/g, ''),
      animation: google.maps.Animation.DROP
    });

    // if (counter === 0) {
    markers.push(marker);
    // }

    for (var m in markers) {
      console.log(m);
      // if (Math.abs(marker.getPosition().lat() - markers[m].getPosition().lat()) < 0.0000001
      //  && Math.abs(marker.getPosition().lng() - markers[m].getPosition().lng()) < 0.0000001) {
      //    console.log("Marker already in list");
      // } else {
      //   markers.push(marker);
      // }
    }
    //
    // counter += 1;

  });

  centerMapOnMarkers();
}

function centerMapOnMarkers() {
  if (markers.length > 0) {
    var bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < markers.length; i++) {
      bounds.extend(markers[i].getPosition());
    }

    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());

    // Make sure we're not zoomed in super close if there is only one marker

    // if (markers.length == 1 ) {
    //   map.setZoom(10);
    // }

  }
}

function showLocation(geotagId, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
  // Set selected placename for suggestion box
  selected_placename = placename;

  // Set form attributes
  $("#place_name").val(placename);
  $("#lat").val(latitude);
  $("#view_lat").val(latitude);
  $("#long").val(longitude);
  $("#view_long").val(longitude);
  Materialize.updateTextFields();

  // Re-center map on selected location
  map.setCenter({lat: latitude, lng: longitude});

  // Zoom map into desired zoom level
  var zoomLevel = viewAltitude / 500;

  console.log(zoomLevel);

  if (zoomLevel < 5) {
    zoomLevel = 10;
  }

  map.setZoom(zoomLevel);

}

let Scriptures = (function () {
  // Force the browser into JS strict compliance mode.
  "use strict";

  // Constants

  const ANIMATION_DURATION = 700;
  const MARKERS_DURATION = 750;
  const SCRIPTURES_URL = "http://scriptures.byu.edu/mapscrip/mapgetscrip.php";

  // Private Variables

  let animatingElements = {};
  let books;
  let requestedBreadcrumbs;
  let requestedNextPrev;
  let volumeArray;

  // Private Methods

  function bookChapterValid(bookId, chapter) {
    let book = books[bookId];

    if (book === undefined || chapter < 0 || chapter > book.numChapters) {
      return false;
    }

    if (chapter === 0 && book.numChapters > 0) {
      return false;
    }

    return true;
  }

  function breadcrumbs(volume, book, chapter) {
    let crumbs = "<ul><li>";

    if (volume === undefined) {
      crumbs += "The Scriptures</li>";
    } else {
      crumbs += "<a href=\"javascript:void(0);\" onclick=\"Scriptures.hash()\">The Scriptures</a></li>";

      if (book === undefined) {
        crumbs += "<li>" + volume.fullName  + "</li>";
      } else {
        crumbs += "<li><a href=\"javascript:void(0);\" onclick=\"Scriptures.hash(" + volume.id + ")\">" + volume.fullName  + "</a></li>";

        if (chapter === undefined || chapter === 0) {
          crumbs += "<li>" + book.tocName  + "</li>";
        } else {
          crumbs += "<li><a href=\"javascript:void(0);\" onclick=\"Scriptures.hash(0, " + book.id + ")\">" + book.tocName  + "</a></li>";
          crumbs += "<li>" + chapter + "</li>";
        }
      }
    }

    return crumbs + "</ul>";
  }

  function cacheBooks() {
    volumeArray.forEach(function (volume) {
      let volumeBooks = [];
      let bookId = volume.minBookId;

      while (bookId <= volume.maxBookId) {
        volumeBooks.push(books[bookId]);
        bookId += 1;
      }

      volume.books = volumeBooks;
    });
  }

  function encodedScriptureUrlPrameters(bookId, chapter, verses, isJst) {
    if (bookId !== undefined && chapter !== undefined) {
      let options = "";

      if (verses !== undefined) {
        options += verses;
      }

      if (isJst !== undefined && isJst) {
        options += "&jst=JST";
      }

      return SCRIPTURES_URL + "?book=" + bookId + "&chap=" + chapter + "&verses=" + options;
    }
  }

  function transitionCrossfade(newContent, property, parentSelector, childSelector) {
    if (animatingElements.hasOwnProperty(property + "In") || animatingElements.hasOwnProperty(property + "Out")) {
      window.setTimeout(transitionCrossfade, 200, newContent);
      return;
    }

    let content = $(parentSelector + " " + childSelector);

    newContent = $(newContent);

    if (content.length > 0) {
      animatingElements[property + "Out"] = content;
      content.animate({
        opacity: 0
      }, {
        queue: false,
        duration: ANIMATION_DURATION,
        complete: function () {
          content.remove();
          delete animatingElements[property + "Out"];
        }
      });

      animatingElements[property + "In"] = newContent;
      newContent.css({opacity: 0}).appendTo(parentSelector);
      newContent.animate({
        opacity: 1
      }, {
        queue: false,
        duration: ANIMATION_DURATION,
        complete: function () {
          delete animatingElements[property + "In"];
        }
      });
    } else {
      $(parentSelector).html(newContent);
    }
  }

  function transitionBreadcrumbs(newCrumbs) {
    transitionCrossfade(newCrumbs, "crumbs", "#crumb", "ul");
  }

  function transitionScriptures(newContent) {
    transitionCrossfade(newContent, "scriptures", "#scriptures", "*");
  }

  function getScriptureCallback(html) {
    html = $(html);
    html.find(".navheading").append("<div class=\"nextprev\">" + requestedNextPrev + "</div>");

    transitionScriptures(html);
    transitionBreadcrumbs(requestedBreadcrumbs);

    deleteMarkers();
    setTimeout(getMarkersForChapter, MARKERS_DURATION);
  }

  function getScriptureFailed() {
    console.log("Warning: scripture request from server failed");
  }

  function titleForBookChapter(book, chapter) {
    return book.tocName + (chapter > 0 ? " " + chapter : "");
  }

  function nextChapter(bookId, chapter) {
    let book = books[bookId];

    if (book !== undefined) {
      if (chapter < book.numChapters) {
        return [bookId, chapter + 1, titleForBookChapter(book, chapter + 1)];
      }

      let nextBook = books[bookId + 1];

      if (nextBook !== undefined) {
        let nextChapterValue = 0;
        if (nextBook.numChapters > 0) {
          nextChapterValue = 1;
        }
        return [nextBook.id, nextChapterValue, titleForBookChapter(nextBook, nextChapterValue)];
      }
    }
  }

  function prevChapter(bookId, chapter) {
    let book = books[bookId];

    if (book !== undefined) {
      if (chapter > 1) {
        return [bookId, chapter - 1, titleForBookChapter(book, chapter - 1)];
      }

      let prevBook = books[bookId - 1];

      if (prevBook !== undefined) {
        return [prevBook.id, prevBook.numChapters, titleForBookChapter(prevBook, prevBook.numChapters)];
      }
    }
  }


  function navigateChapter(bookId, chapter) {
    if (bookId !== undefined) {
      let book = books[bookId];
      let volume = volumeArray[book.parentBookId - 1];

      requestedBreadcrumbs = breadcrumbs(volume, book, chapter);

      let nextPrev = prevChapter(bookId, chapter);

      if (nextPrev === undefined) {
        requestedNextPrev = "";
      } else {
        requestedNextPrev = "<a href=\"javascript:void(0);\" onclick=\"Scriptures.hash(0, " + nextPrev[0] + ", " + nextPrev[1] + ")\" title=\"" + nextPrev[2] + "\"><i class=\"material-icons\">skip_previous</i></a>";
      }

      nextPrev = nextChapter(bookId, chapter);

      if (nextPrev !== undefined) {
        requestedNextPrev += "<a href=\"javascript:void(0);\" onclick=\"Scriptures.hash(0, " + nextPrev[0] + ", " + nextPrev[1] + ")\" title=\"" + nextPrev[2] + "\"><i class=\"material-icons\">skip_next</i></a>";
      }

      $.ajax({
        "url": encodedScriptureUrlPrameters(bookId, chapter),
        "success": getScriptureCallback,
        "error": getScriptureFailed
      });
    }
  }

  function navigateBook(bookId) {
    let book = books[bookId];
    let volume = volumeArray[book.parentBookId - 1];

    if (book.numChapters <= 0) {
      navigateChapter(book.id, 0);
    } else if (book.numChapters === 1) {
      navigateChapter(book.id, 1);
    } else {
      let chapter = 1;
      let navContents = "<div id=\"scripnav\"><div class=\"volume\"><h5>" + book.fullName + "</h5></div><div class=\"books\">";
      while (chapter <= book.numChapters) {
        navContents += "<a class=\"waves-effect waves-custom waves-ripple btn chapter\" id=\"" + chapter + "\" href=\"#0:" + book.id + ":" + chapter + "\">" + chapter + "</a>";
        chapter += 1;
      }

      navContents += "</div>";

      transitionScriptures(navContents);
      transitionBreadcrumbs(breadcrumbs(volume, book));
    }
  }

  function navigateHome(volumeId) {
    let displayedVolume;
    let navContents = "<div id=\"scripnav\">";

    volumeArray.forEach(function (volume) {
      if (volumeId === undefined || volume.id === volumeId) {
        navContents += "<div class=\"volume\"><a name=\"v" + volume.id + "\" /><h5>" + volume.fullName + "</h5></div><div class=\"books\">";
        volume.books.forEach(function (book) {
          navContents += "<a class=\"waves-effect waves-custom waves-ripple btn\" id=\"" + book.id + "\" href=\"#" + volume.id + ":" + book.id + "\">" + book.gridName + "</a>";
        });
        navContents += "</div>";

        if (volume.id === volumeId) {
          displayedVolume = volume;
        }
      }
    });

    navContents += "<br /><br /></div>";

    transitionScriptures(navContents);
    transitionBreadcrumbs(breadcrumbs(displayedVolume));
  }

  // Public API

  const publicInterface = {
    bookByID(bookId) {
      return books[bookId];
    },

    hash(volumeId, bookId, chapter) {
      let newHash = "";

      if (volumeId !== undefined) {
        newHash += volumeId;

        if (bookId !== undefined) {
          newHash += ":" + bookId;

          if (chapter !== undefined) {
            newHash += ":" + chapter;
          }
        }
      }

      window.location.hash = newHash;
    },

    init(callback) {
      let booksLoaded = false;
      let volumesLoaded = false;

      $.ajax({
        "url": "http://scriptures.byu.edu/mapscrip/model/books.php",
        "dataType": "json",
        "success": function (data) {
          books = data;
          booksLoaded = true;
          if (volumesLoaded) {
            cacheBooks();
            if(typeof callback === "function") {
              callback();
            }
          }
        }
      });

      $.ajax({
        "url": "http://scriptures.byu.edu/mapscrip/model/volumes.php",
        "dataType": "json",
        "success": function (data) {
          volumeArray = data;
          volumesLoaded = true;
          if (booksLoaded) {
            cacheBooks();
            if(typeof callback === "function") {
              callback();
            }
          }
        }
      });
    },

    onHashChanged() {
      let ids = [];
      let bookId;

      if (window.location.hash !== "" && window.location.hash.length > 1) {
        // Remove leading # and split string on :
        ids = window.location.hash.substring(1).split(":");
      }

      if (ids.length <= 0) {
        navigateHome();
      } else if (ids.length === 1) {
        // Show single volume's table of contents
        let volumeId = Number(ids[0]);

        if (volumeId < volumeArray[0].id || volumeId > volumeArray[volumeArray.length - 1].id) {
          navigateHome();
        } else {
          navigateHome(volumeId);
        }
      } else if (ids.length === 2) {
        // Show a book's list of chapters
        bookId = Number(ids[1]);

        if (books[bookId] === undefined) {
          navigateHome();
        } else {
          navigateBook(bookId);
        }
      } else {
        // Display a specific chapter
        bookId = Number(ids[1]);
        let chapter = Number(ids[2]);

        if (!bookChapterValid(bookId, chapter)) {
          navigateHome();
        } else {
          navigateChapter(bookId, chapter);
        }
      }
    },

    urlForScriptureChapter(bookId, chapter, verses, isJst) {
      let book = books[bookId];

      if (book !== undefined) {
        if ((chapter === 0 && book.numChapters === 0) || (chapter > 0 && chapter <= book.numChapters)) {
          return encodedScriptureUrlPrameters(bookId, chapter, verses, isJst);
        }
      }
    },

    volumes() {
      return volumeArray.slice();
    }
  };

  return publicInterface;
}());
