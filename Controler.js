"use strict";
/*globals Model, Status, chrome*/
/**********************************************/
/**Controler **/
/**********************************************/

var Controler = function Controler() {
  this.model = new Model();
};

/*Complette params to url request for Goole Translate*/
Controler.prototype.translate = function (str, cb) {
  /*Corection for auto target language*/
  if (Status.options['target-language'][1] === 'auto') {
    Status.options['target-language'][1] = window.clientInformation.language;
  }
  this.model.trlang = Status.options['target-language'][1];
  this.model.srclang = Status.options['source-language'][1];

  var apiurl = 'https://translate.googleapis.com/translate_a/single?';
  var transurl = {
    dt: 't',
    dj: '1',
    sl: this.model.srclang,
    tl: this.model.trlang,
    client: 'gtx',
    source: 'buble'
  };
  
  var trurl = [];
  for(var key in transurl) {
    trurl.push(key + '=' + transurl[key]);
  }
  
  var q = encodeURIComponent(str);
  var url = apiurl + trurl.join('&');
  /*get translation object*/
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type',  "application/x-www-form-urlencoded");
  xhr.send('q=' + q);
  
  var self = this;
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.response);
          var out = '';
          var trchunk = '';
          self.model.srclang = data.src;
          for (var i = 0; i < data.sentences.length; i++) {
            trchunk = data.sentences[i].trans;
            out += trchunk;
          }
          cb(null, out);
        } catch(e) {
          cb(chrome.i18n.getMessage('ajax_json_parse_err') + ' - ' + e, false);
        }
      } else {
        cb(chrome.i18n.getMessage('ajax_get_data_err') + ' - XHR status: ' + xhr.status, false);
      }
    }
  };
};

Controler.prototype.translateHTML = function(el) {
  var nodear = []; /*text nodes untranslated*/
  var trtextar = []; /*translated text nodes*/
  var joinkey = '⌨';
  var self = this;
  var walker = function(node, cb) {
    cb(node);
    node = node.firstChild;
    while(node) {
      walker(node, cb);
      node = node.nextSibling;
    }
  };
  /*translate textNodes joined with (joinkey) one string*/
  var translated = function(domar, key) {
    var textar = []; /*extracted texts from dom nodes*/
    for (var i = 0; i < domar.length; i++) {
      textar.push(domar[i].data); /*get string from dom node*/
    }
    var text = textar.join(key);
    /*translate text on html elements splited on joinkey*/
    self.translate(text, function(err, translated) {
      if (!err) {
        trtextar = translated.split(joinkey);
        for(var e = 0; e < trtextar.length; e++) {
          var fragment = trtextar[e];
          if(nodear[e]) { //replace text only if true
            nodear[e].data = fragment;
          }
        }
        self.model.translated = el.innerHTML;
        el.classList.remove('waiting');
        el.classList.add('translated');
        el.lang = self.model.trlang; /*add lang*/
        el.title = el.lang.toUpperCase();
      } else {
        /*Switch HTML to Error mesage*/
        self.model.translated = el.innerHTML = '<strong>' + chrome.i18n.getMessage('translation_fail') + ' - ' + err + '</strong>';
      }
    });
  };

  /*save all text nodes*/
  walker(el, function (node) {
    if(node.nodeType === 3) {
      var text = node.data.trim();
      /*text data must be non-empty and included any \w char*/
      if (self.isword(text)) {
        /*<pre> and non-<pre> content logic*/
        self.isinpre(node, function(inar) {
          if (inar) {
            /*filter multiple spaces only*/
            node.data = node.data.replace(/ +/g, ' ');
          } else {
            /*filter all multiple spaces char*/
            node.data = node.data.replace(/\s+/g, ' ');
          }
          nodear.push(node);
        });
      }
    }
  });

  /* translate text nodes*/
  translated(nodear, joinkey);
};

Controler.prototype.isinpre = function(node, cb) {
  var par = node.parentNode;
  if (par) {
    if (par.nodeName === 'PRE') {
      cb(true);
    } else {
      this.isinpre(par, cb);
    }
  } else {
    cb(false);
  }
};

Controler.prototype.isword = function(str) {
  /*verify that string contains any word character*/
  if (str.length > 0) {
    return true;
  } else {
    return false;
  }
};

/**** Audio TTS ****/
/*Get words for audio processing*/
Controler.prototype.getwords = function(str) {
  var words = str.split(' '); /*get words*/
  words = words.map(function(e) {
    return e.trim().replace(/ +/g, ''); /*trim trailing whitespaces*/
  });
  return words;
};

/*Cut words array to messages <= 100 chars by Google tts*/
Controler.prototype.getttsparts = function (str, limit) {
  var words = this.getwords(str); /*make words array*/
  var onesms = []; /*one part*/
  var smsar = []; /*all parts*/
  while (words[0]) {
    var lastword = words[0];
    var afteradd = onesms.join(' ').length + (1 + lastword.length);
    if (afteradd >= limit)  {
      smsar.push(onesms.join(' ')); /*insert <= charlimit len str*/
      onesms = []; /*zeroes onesms*/
    } else {
      onesms.push(words.shift()); /*insert first word*/
    }
  }
  if (onesms[0]) {
    smsar.push(onesms.join(' ')); /*add remained words if exists*/
  }
  return smsar;
};

/*Make audio src urls with tts sms*/
Controler.prototype.ttsurls = function (sms, tl) {
  var client = 'tw-ob';
  var ie = 'UTF-8';
  var total = sms.length;
  var url = 'https://translate.google.com/translate_tts?';
  var out = sms.map(function(e, i) {
    var idx = i;
    var q = encodeURIComponent(e);
    var textlen = e.length;
    var src = url + 'ie=' + ie + '&q=' + q + '&tl=' + tl + '&total=' + total +
     '&idx=' + idx + '&textlen=' + textlen + '&client=' + client;
    return src;
  });
  return out;
};
