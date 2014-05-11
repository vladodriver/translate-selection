"use strict";
/*global chrome, Status*/

/*Load options from Local Storage*/
var defopts = {
  options: {
    'translate-key': ['T', 'T'.charCodeAt(), '----'],
    'tts-key': ['V', 'V'.charCodeAt(), '----'],
    'resize-hold-key': ['Ctrl', 17],
    'freeze-hold-key': ['Shift', 16],
    'source-language': ['Autodetect', 'auto'],
    'target-language': ['Autodetect', 'auto']
  },
  disurls: ['www.google.cz']
};

/*Save default options to storage when run first time*/
var setopts = function() {
  chrome.storage.local.get(null, function(data) {
    var obj = null;
    if(Object.keys(data).length === 0) {
      console.log('Storage is emty, full data (options && disurls) will be created!');
      obj = defopts;
    } else if (typeof data.options !== 'object' || Object.keys(data.options).length === 0) {
      console.log('Valid object <options> not exists in storage, will be created from default options!');
      obj = {};
      obj.options = defopts.options;
    } else if (typeof data.disurls !== 'object' || data.disurls.constructor.name !== 'Array') {
      console.log('Valid object array <disurls> not exists in storage, will be created from default options!');
      obj = {};
      obj.disurls = defopts.disurls;
    } else {
      var invalidopt = false;
      obj = obj || {options: {}}; //remporary crete object obj
      for (var opt in defopts.options) {
        /*Validation options format and data type*/
        if(!data.options[opt] || typeof data.options[opt] !== 'object' || data.options[opt].constructor.name !== 'Array' || data.options[opt].length !== defopts.options[opt].length) {
          console.log('Object property ' + opt + ' not a valid, will be set to default ' + defopts.options[opt] + '!');
          obj.options[opt] = defopts.options[opt]; //restore from defaults
          invalidopt = true;
        } else {
          obj.options[opt] = data.options[opt]; //keep user defined when is valid
        }
      }
      if (!invalidopt) {
        obj = null; //reset when all options is valid (invalidopt === false)
      }
    }
    
    if (obj) {
      chrome.storage.local.set(obj, function() {
        console.log('Default ptions loaded/restored', obj);
      });
    }
  });
};

var tabevs = ['onUpdated', 'onActivated'];

var tabaction = function(ev) {
  chrome.tabs[ev].addListener(function(tab) {
    var id = (ev === 'onUpdated') ? tab : tab.tabId;
    chrome.tabs.get(id, function(tab) {
      var h = document.createElement('a');
      h.href = tab.url;
      console.log('ACTION', ev, 'URL', tab, 'ID', id);
      setonoff(h.host);
    });
  });
};

var setonoff = function(host) {
  setopts(host);
  chrome.storage.local.get(null, function(data) {
    if (data.disurls && data.disurls.constructor.name === 'Array') {
      chrome.browserAction.setBadgeText({text: (data.disurls.indexOf(host) !== -1) ? 'OFF' : 'ON'});
      chrome.browserAction.setBadgeBackgroundColor({color: (data.disurls.indexOf(host) !== -1) ? '#f00' : '#0f0'});
    }
  });
};

/*Add updated & activated events*/
for (var i = 0; i < tabevs.length; i++) {
  tabaction(tabevs[i]);
}
