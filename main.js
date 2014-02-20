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
    'target-language': ['Autodetect', "auto"]
  }
};

/*Save default options to storage when run first time*/
var setopts = function(obj) {
  chrome.storage.local.set(obj, function() {
    console.log('First time RTS run -> default options created');
  });
};

chrome.storage.local.get('options', function(o) {
  if (Object.keys(o).length === 0) {
    setopts(defopts);
    Status.options = defopts.options;
  } else {
    Status.options = o.options;
  }
  window.onkeydown = keydown;
  window.onkeyup = keyup;
});

/*Save options to Status when changed settings in popup*/
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (var key in changes) {
    var storageChange = changes[key];
    Status.options = storageChange.newValue;
    
  }
});

/*On keypress t key create ready popup and translate text*/
var keydown = function(e) {
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
};

var keyup = function(e) {
  if(e.keyCode === Status.options['resize-hold-key'][1]) {
    Status.resize = false;
  } else if (e.keyCode === Status.options['freeze-hold-key'][1]) {
    Status.freeze = false;
  }
};
