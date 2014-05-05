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
    
    /*Get holding key string from event*/
    var getholdkey = function(ev) {
      var holding;
      if (ev.altKey) {
        holding = 'Alt';
      } else if (ev.ctrlKey) {
        holding = 'Ctrl';
      } else if (ev.shiftKey) {
        holding = 'Shift';
      } else {
        holding = '----';
      }
      return holding;
    };
    
    /*run translate || audio actions*/
    if ((e.keyCode === Status.options['translate-key'][1]) && (getholdkey(e) === Status.options['translate-key'][2])) {
      view.popupcreate();
    } else if ((e.keyCode === Status.options['tts-key'][1]) && (getholdkey(e) === Status.options['tts-key'][2])) {
      view.voice();
    } else if (e.keyCode === Status.options['freeze-hold-key'][1]) { /*<CTRL>*/
      Status.freeze = true;
    } else if (e.keyCode === Status.options['resize-hold-key'][1]) { /*<SHIFT>*/
      Status.resize = true;
    }
  }
};

var keyup = function(e) {
    Status.resize = false;
    Status.freeze = false;
};