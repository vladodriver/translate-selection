(function() {
    "use strict";
    /*globals chrome*/
    var Langs = {
      "Autodetect": "auto",
      "Afrikaans": "af",
      "Albanian":	"sq",
      "Arabic": "ar",
      "Azerbaijani": "az",
      "Basque": "eu",
      "Bengali": "bn",
      "Belarusian":	"be",
      "Bulgarian":	"bg",
      "Catalan": "ca",
      "Chinese Simp.": "zh-CN",
      "Chinese Trad.": "zh-TW",
      "Croatian": "hr",
      "Czech": "cs",
      "Danish": "da",
      "Dutch": "nl",
      "English": "en",
      "Esperanto": "eo",
      "Estonian": "et",
      "Filipino":	"tl",
      "Finnish": "fi",
      "French":	"fr",
      "Galician":	"gl",
      "Georgian":	"ka",
      "German": "de",
      "Greek": "el",
      "Gujarati":	"gu",
      "Haitian Creole":	"ht",
      "Hebrew": "iw",
      "Hindi": "hi",
      "Hungarian":	"hu",
      "Icelandic": "is",
      "Indonesian":	"id",
      "Irish": "ga",
      "Italian": "it",
      "Japanese":	"ja",
      "Kannada": "kn",
      "Korean":	"ko",
      "Latin": "la",
      "Latvian": "lv",
      "Lithuanian":	"lt",
      "Macedonian":	"mk",
      "Malay": "ms",
      "Maltese": "mt",
      "Norwegian": "no",
      "Persian": "fa",
      "Polish":	"pl",
      "Portuguese":	"pt",
      "Romanian":	"ro",
      "Russian": "ru",
      "Serbian": "sr",
      "Slovak":	"sk",
      "Slovenian": "sl",
      "Spanish": "es",
      "Swahili": "sw",
      "Swedish": "sv",
      "Tamil": "ta",
      "Telugu":	"te",
      "Thai":	"th",
      "Turkish": "tr",
      "Ukrainian": "uk",
      "Urdu":	"ur",
      "Vietnamese":	"vi",
      "Welsh": "cy",
      "Yiddish": "yi"
    };
    
    var HoldKeys = {
      "Shift": 16,
      "Ctrl": 17
    };
    
    /*Fill i18n strings*/
    var title = document.querySelector('title');
    title.textContent = chrome.i18n.getMessage('pop_title');
    var trkeyl = document.querySelector('label[for="translate-key"]');
    trkeyl.innerHTML = chrome.i18n.getMessage('tr_key_label');
    var ttsl = document.querySelector('label[for="tts-key"]');
    ttsl.innerHTML = chrome.i18n.getMessage('tts_key_label');
    var resl =  document.querySelector('label[for="resize-hold-key"]');
    resl.innerHTML = chrome.i18n.getMessage('resize_key_label');
    var frel = document.querySelector('label[for="freeze-hold-key"]');
    frel.innerHTML = chrome.i18n.getMessage('freeze_key_label');
    var srcl = document.querySelector('label[for="source-language"]');
    srcl.innerHTML = chrome.i18n.getMessage('src_lang_label');
    var trl = document.querySelector('label[for="target-language"]');
    trl.innerHTML = chrome.i18n.getMessage('tr_lang_label');
    var reset = document.querySelector('#reset');
    reset.textContent = chrome.i18n.getMessage('reset_button');
    var msg = document.querySelector('#msg'); //messages and errors
    /*Fill in form elements options*/
    /*Source language options*/
    var srclanghtml = '';
    for (var s in Langs) {
      srclanghtml += '<option value="' + Langs[s] + '">' + s + '</option>';
    }
    document.getElementById('source-language').innerHTML = srclanghtml;
    
    /*Target language options*/
    var trlanghtml = '';
    for (var t in Langs) {
      trlanghtml += '<option value="' + Langs[t] + '">' + t + '</option>';
    }
    document.getElementById('target-language').innerHTML = trlanghtml;
    
    /*Resize and freeze popup keys fill*/
    var resizehtml = '';
    var freezehtml = '';
    for (var rf in HoldKeys) {
      resizehtml += '<option value="' + HoldKeys[rf] + '">' + rf + '</option>';
      freezehtml += '<option value="' + HoldKeys[rf] + '">' + rf + '</option>';
    }
    document.getElementById('resize-hold-key').innerHTML = resizehtml;
    document.getElementById('freeze-hold-key').innerHTML = freezehtml;
    
    /**************Storage save and load options Class **********************/
    /*Get and save options to Local Storage*/
    var Storage = function() {
      this.errors = [];
      this.opts = {
        options: {},
        disurls: []
      };
    };
    
    Storage.prototype.validchar = function(c) {
      if (!c.match(/^[a-zA-Z]$/g)) {
        this.errors.push(chrome.i18n.getMessage('invalid_key_err') + c);
        return false;
      } else {
        return true;
      }
    };
    
    Storage.prototype.validopt = function(opt, optobj) {
      if (!(opt in optobj)) {
        this.errors.push(chrome.i18n.getMessage('invalid_key_err') + opt);
        return false;
      } else {
        return true;
      }
    };
    
    Storage.prototype.validdiff = function() {
      /*Corection Ctrl/Shift - prevent select same selection and same keys*/
      var translateel = document.getElementById('translate-key');
      var ttsel = document.getElementById('tts-key');
      var resizeel = document.getElementById('resize-hold-key');
      var freezeel = document.getElementById('freeze-hold-key');
      
      if (resizeel.options[resizeel.selectedIndex].value === freezeel.options[freezeel.selectedIndex].value) {
        this.errors.push(chrome.i18n.getMessage('freeze_res_same_key_err'));
      } else if (translateel.value.toUpperCase() === ttsel.value.toUpperCase()) {
        this.errors.push(chrome.i18n.getMessage('srclkey_trlkey_same_err'));
      }
    };
    
    Storage.prototype.gethost = function(url) {
      var a = document.createElement('a');
      a.href = url;
      return a.host;
    };
    
    Storage.prototype.addurl = function(url) {
      /*add url to array only if no exist*/
      if (this.opts.disurls.indexOf(url) === -1) {
        this.opts.disurls.push(url);
      }
    };
    
    Storage.prototype.delurl = function(url) {
      /*Delete url of array only if exist*/
      if (this.opts.disurls.indexOf(url) !== -1) {
        this.opts.disurls.splice(this.opts.disurls.indexOf(url), 1);
      }
    };
    
    Storage.prototype.message = function(msg, type) {
      var msgel = document.getElementById('msg');
      if (type === 'm') {
        msgel.style.color = 'green';
      } else if (type === 'e') {
        msgel.style.color = 'red';
      }
      msgel.textContent = msg;
    };
    
    Storage.prototype.inactive = function(bol, domain) {
      /*Activate/deactivate inputs in form except checkbox and checkbox label*/
      var elements = document.querySelectorAll('.activatable');
      var disurllabel = document.querySelector('#disable-status');
      var checkbox = document.querySelector('#on-off');
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        if (el.nodeName === 'LABEL') {
          el.style.color = (bol) ? '#ddd' : 'black';
        } else {
          el.disabled = (bol) ? true : false;
        }
      }
      checkbox.checked = (bol) ? false : true;
      disurllabel.innerHTML = (bol) ?
        chrome.i18n.getMessage('enable_url_label', domain) :
        chrome.i18n.getMessage('disable_url_label', domain);
      chrome.browserAction.setBadgeText({text: (bol) ? 'OFF' : 'ON'});
      chrome.browserAction.setBadgeBackgroundColor({color: (bol) ? '#f00' : '#0f0'});
    };
    
    Storage.prototype.save = function() {
      /*Save blacklist urls*/
      var self = this;
      chrome.tabs.query({active: true, windowType: 'normal'}, function(tab) {
        self.message('', 'm');
        /*Validate and save disable state*/
        var domain = self.gethost(tab[0].url);
        var checkbox = document.querySelector('#on-off');
        if(checkbox.checked) {
          self.delurl(domain);
          self.inactive(false, domain);
        } else {
          self.addurl(domain);
          self.inactive(true, domain);
        }
        
        /*validate text inputs translate and tts key*/
        var keyinps = document.querySelectorAll('input[type="text"]');
        for (var i = 0; i < keyinps.length; i++) {
          var ki = keyinps[i];
          ki.value = ki.value.toUpperCase();
          if (self.validchar(ki.value)) {
            self.opts.options[ki.id] = [ki.value, ki.value.charCodeAt()];
          }
        }
        
        /*validate select options*/
        var csels = document.querySelectorAll('select');
        for (var j = 0; j < csels.length; j++) {
          var csel = csels[j];
          var selcon = csel.options[csel.selectedIndex].textContent;
          var numericval = parseInt(csel.options[csel.selectedIndex].value, 10);
          var selval = (numericval) ? numericval : csel.options[csel.selectedIndex].value;
          var optobj = (csel.id === 'resize-hold-key' || csel.id === 'freeze-hold-key') ? HoldKeys : Langs;
          if(self.validopt(selcon, optobj)) {
            self.opts.options[csel.id] = [selcon, selval];
          }
        }
        
        /*Validate duplicate values for keys and shift/ctrl select options*/
        self.validdiff();
        if (self.errors[0]) {
          self.message(self.errors.join(' '), 'e');
          self.errors = []; //error state reset
        } else {
          chrome.storage.local.set(self.opts, function() {
            self.message(chrome.i18n.getMessage('options_saved'), 'm');
          });
        }
      });
    };
    
    Storage.prototype.load = function() {
      var self = this;
      chrome.storage.local.get(null, function(o) {
        if (Object.keys(o).length === 0) {
          self.message(chrome.i18n.getMessage('first_browse_err'), 'e');
          var hideall = document.querySelectorAll('form, button, hr');
          for (var e = 0; e < hideall.length; e++) {
            hideall[e].style.display = 'none';
          }
          return false;
        }
        var options = o.options;
        /*load disable domain checkbox and activate/deactivate TRS*/
        self.opts.disurls = o.disurls;
        chrome.tabs.query({active: true, windowType: 'normal'}, function(tab) {
          var domain = self.gethost(tab[0].url);
          var deactivate = (self.opts.disurls.indexOf(domain) !== -1) ? true : false;
          self.inactive(deactivate, domain);
        });
        /*load values of text inputs*/
        var trttskeys = document.querySelectorAll('input[type="text"]');
        for (var i = 0; i < trttskeys.length; i++) {
          var el = trttskeys[i];
          el.value = options[el.id][0];
        }
        /*load options for checkboxes shift/ctrl*/
        var selects = document.querySelectorAll('select');
        for (var j = 0; j < selects.length; j++) {
          var sel = selects[j];
          var loadopts = options[sel.id];
          var selopts = sel.options;
          for (var k = 0; k < selopts.length; k++) {
            var opt = selopts[k];
            if (opt.textContent === loadopts[0].toString() && opt.value === loadopts[1].toString()) {
              sel.selectedIndex = k;
            }
          }
        }
        /*Load disurls*/
        self.opts.disurls = o.disurls;
        self.message(msg.textContent = chrome.i18n.getMessage('options_loaded'), 'm');
      });
    };
    
    Storage.prototype.reseting = function(e) {
      chrome.storage.local.clear();
      this.message(chrome.i18n.getMessage('options_reseted'), 'm');
    };
    
    /*Main program...*/
    var storage = new Storage();
    storage.load(); /*Load default or saved options*/
    document.querySelector('form').onchange = function() {
      storage.save();
    };
    document.getElementById('reset').onclick = function() {
      storage.reseting();
    };
    
}) ();