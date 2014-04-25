"use strict";
/*global chrome*/

var setonoff = function(host) {
  chrome.storage.local.get(null, function(data) {
    chrome.browserAction.setBadgeText({text: (data.disurls.indexOf(host) !== -1) ? 'OFF' : 'ON'});
    chrome.browserAction.setBadgeBackgroundColor({color: (data.disurls.indexOf(host) !== -1) ? '#f00' : '#0f0'});
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

/*Add updated & activated evants*/
for (var i = 0; i < tabevs.length; i++) {
  tabaction(tabevs[i]);
}