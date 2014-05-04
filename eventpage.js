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

var setonoff = function(host) {
  chrome.storage.local.get(null, function(data) {
    if (Object.keys(data).length === 0) {
      setopts(defopts);
    } else {
      chrome.browserAction.setBadgeText({text: (data.disurls.indexOf(host) !== -1) ? 'OFF' : 'ON'});
      chrome.browserAction.setBadgeBackgroundColor({color: (data.disurls.indexOf(host) !== -1) ? '#f00' : '#0f0'});
    }
  });
};

/*Save default options to storage when run first time*/
var setopts = function(obj) {
  chrome.storage.local.set(obj, function() {
    console.log('TRS first time run -> default options loaded', obj);
  });
};

var tabevs = ['onUpdated', 'onActivated'];

var tabaction = function(ev) {
  chrome.tabs[ev].addListener(function(tab) {
    var id = (ev === 'onUpdated') ? tab : tab.tabId;
    chrome.tabs.get(id, function(tab) {
      var h = document.createElement('a');
      h.href = tab.url;
      setonoff(h.host);
    });
  });
};

/*Add updated & activated events*/
for (var i = 0; i < tabevs.length; i++) {
  tabaction(tabevs[i]);
}
