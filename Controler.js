"use strict";
/*globals Model, Status, chrome*/
/**********************************************/
/**Controler **/
/**********************************************/

var Controler = function Controler() {
  this.model = new Model();
};

/*Complette params to url request for Goole Translate*/
Controler.prototype.translate = function (str) {
  /*Corection for auto target language*/
  if (Status.options['target-language'][1] === 'auto') {
    Status.options['target-language'][1] = window.clientInformation.language;
  }
  this.model.trlang = Status.options['target-language'][1];
  this.model.srclang = Status.options['source-language'][1];
  var turl = 'https://translate.google.cz/translate_a/t?';
  var client = 'j'; /*if(!t) => vystup bude json..*/
  var tl = this.model.trlang;
  var sl = this.model.srclang;
  var ie, oe; 
  ie = oe = 'UTF-8';
  var q = encodeURIComponent(str);
  var url = turl + 'client=' + client + '&sl=' + sl + '&tl=' + tl + '&ie=' + ie + '&oe=' + oe;
  /*get translation object*/
  var trobj = this.getjson(url, q);
  if(trobj) {
    this.model.srclang = trobj.src; /*save detected src lang*/
    var out = '';
    var trchunk = '';
    for (var i = 0; i < trobj.sentences.length; i++) {
      trchunk = trobj.sentences[i].trans;
      out += trchunk;
    }
    return out;
  } else {
    return false;
  }
};

Controler.prototype.translateHTML = function(el) {
  var nodear = []; /*text nodes untranslated*/
  var trtextar = []; /*translated texts*/
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
    var translated = self.translate(text);
    if (translated) {
      trtextar = translated.split(joinkey);
      for(var e = 0; e < trtextar.length; e++) {
        var fragment = trtextar[e];
        nodear[e].data = fragment;
      }
      self.model.translated = el.innerHTML;
    } else {
      /*Switch HTML to Error mesage*/
      self.model.translated = el.innerHTML = '<strong>' + chrome.i18n.getMessage('translation_fail') + '</strong>';
    }
  };

  /*save all text nodes*/
  walker(el, function (node) {
    if(node.nodeType === 3) {
      var text = node.data.trim();
      /*text data must be non-empty and included any \w char*/
      if(text.length > 0 && self.isword(text)) {
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
  if (str.match(/\w/)) {
    return true;
  } else {
    return false;
  }
};

/*Ajax get request to google and */
Controler.prototype.getjson = function (url, text) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, false);
  xhr.setRequestHeader('Content-Type',  "application/x-www-form-urlencoded");
  try {
    xhr.send('q=' + text);
  } catch(e) {
    console.error('Send data to Google failed.. ' + e);
    return false;
  }
  if (xhr.status === 200) {
    return JSON.parse(xhr.response);
  } else {
    console.error('Response Google not OK: ' + xhr.status, xhr.responseText);
    return false;
  }
};

/**** Audio TTS ****/
/*Get words for audio processing*/
Controler.prototype.getwords = function(str) {
  var words = str.split(' '); /*get words*/
  words = words.map(function(e, i ,a) {
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
  var ie = 'utf8';
  var total = sms.length;
  var url = 'http://translate.google.com/translate_tts?';
  var prev = 'input';
  var out = sms.map(function(e, i, a) {
    var idx = i;
    var q = encodeURIComponent(e);
    var textlen = e.length;
    var src = url + 'ie=' + ie + '&q=' + q + '&tl=' + tl + '&total=' + total +
     '&idx=' + idx + '&textlen=' + textlen + '&prev=' + prev;
    return src;
  });
  return out;
};