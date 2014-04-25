/*globals chrome, Status, View*/
"use strict";

/****************************************************/
/*Main Events for running actions*/
/****************************************************/

/*Load options from Local Storage*/
var defopts = {
  options: {
    'translate-key': ['T', 'T'.charCodeAt()],
    'tts-key': ['V', 'V'.charCodeAt()],
    'resize-hold-key': ['Ctrl', 17],
    'freeze-hold-key': ['Shift', 16],
    'source-language': ['Autodetect', 'auto'],
    'target-language': ['Autodetect', 'auto']
  },
  disurls: ['www.google.cz']
};

/*Save default options to storage when run first time*/
var setopts = function(obj) {
  chrome.storage.local.set(obj, function() {
    console.log('TRS first time run -> default options created', obj);
  });
};

chrome.storage.local.get(null, function(o) {
  if (Object.keys(o).length === 0) {
    setopts(defopts);
    Status.options = defopts.options;
    Status.disurls = defopts.disurls;
  } else {
    Status.options = o.options;
    Status.disurls = o.disurls;
  }
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
  
  if(Status.disurls.indexOf(location.host) === -1) {
    var view = new View();
    if (e.keyCode === Status.options['translate-key'][1]) { /*<T>*/
      view.popupcreate();
    } else if (e.keyCode === Status.options['freeze-hold-key'][1]) { /*<CTRL>*/
      Status.freeze = true;
    } else if (e.keyCode === Status.options['resize-hold-key'][1]) { /*<SHIFT>*/
      Status.resize = true;
    } else if (e.keyCode === Status.options['tts-key'][1]) { /*<V>*/
      view.voice();
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