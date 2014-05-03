/*globals chrome, Status, View*/
"use strict";

/****************************************************/
/*Main Events for running actions*/
/****************************************************/

chrome.storage.local.get(null, function(o) {
  Status.options = o.options;
  Status.disurls = o.disurls;
  
  window.onkeydown = keydown;
  window.onkeyup = keyup;
});

/*Save options to Status when changed settings in popup*/
chrome.storage.onChanged.addListener(function(changes) {
  for (var key in changes) {
    var storageChange = changes[key];
    Status[key] = storageChange.newValue;
  }
});

/*On keypress t key create ready popup and translate text*/
var keydown = function(e) {
  /*Run only if non-blacklisted urls*/
  if(Status.disurls.indexOf(location.host) === -1) {
    var view = new View();//instance of View
    /*run translate || audio actions*/
    var viewaction = function(ev, id, action) {
      var alt = (Status.options[id][2]);
      var ctrl = (Status.options[id][3]);
      var shift = (Status.options[id][4]);
      if ((alt === ev.altKey) && (ctrl === ev.ctrlKey) && (shift === ev.shiftKey)) {
        view[action].call(view);
      }
    };
    if (e.keyCode === Status.options['translate-key'][1]) {
      viewaction(e, 'translate-key', 'popupcreate');
    } else if (e.keyCode === Status.options['tts-key'][1]) {
      viewaction(e, 'tts-key', 'voice');
    } else if (e.keyCode === Status.options['freeze-hold-key'][1]) { /*<CTRL>*/
      Status.freeze = true;
    } else if (e.keyCode === Status.options['resize-hold-key'][1]) { /*<SHIFT>*/
      Status.resize = true;
    }
  }
};

var keyup = function(e) {
  if(e.keyCode === Status.options['resize-hold-key'][1]) {
    Status.resize = false;
  } else if (e.keyCode === Status.options['freeze-hold-key'][1]) {
    Status.freeze = false;
  }
};