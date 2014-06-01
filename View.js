"use strict";
/*globals Controler, Status, chrome*/
/*********************************************/
/** View **/
/*********************************************/

var View = function View() {
  this.controler = new Controler();
};

View.prototype.popupcreate = function() {
  /*Get selection range and popup same as document*/
  var range = this.selection();
  if (!range) return false;
  /*Create popup and injecting translated results*/
  var pop = document.createElement('div');
  pop.className = 'translate-pop';
  pop.classList.add('focused-pop');
  var fragment = range.cloneContents();
  /*main selection container data*/
  var ancestor = range.commonAncestorContainer; /*get range container*/
  /*No elements on range (only select plain text) -> need corections*/
  var innerfrag; /*Inner fragment*/
  if (ancestor.nodeType === 3) {
    /*create copy of parent element*/
    var textparent = pop.appendChild(ancestor.parentNode.cloneNode());
    /*parent to parent of a text node is parent all elements in range*/
    ancestor = ancestor.parentNode.parentNode;
    innerfrag = textparent; /*add cloned parent element*/
    textparent.appendChild(fragment); /*insert text data from range*/
  } else {
    /*ancestor is parent all elements*/
    innerfrag = fragment; /*Elements in range found - insert fragment*/
  }

  var maxw = document.body.clientWidth * 0.9;
  var rwidth = range.getBoundingClientRect().width;
  ancestor.appendChild(pop);
  pop.appendChild(innerfrag); /*add range fragment*/

  pop.id = Status.popid++;
  this.refocus(pop); /*focus to new createt pop*/
  pop.style.top = range.getBoundingClientRect().top + 'px';
  pop.style.left = range.getBoundingClientRect().left + 'px';
  pop.style.width = rwidth + 'px'; /*set width same as selection*/
  pop.style.maxWidth = maxw + 'px';
  pop.style.zIndex = Status.popz++;
  pop.classList.add('waiting');
  /*save initial scroll X & Y position*/
  pop.scx = Status.scrollX;
  pop.scy = Status.scrollY;
  this.controler.model.original = pop.innerHTML;
  /*translation from Google*/
  this.controler.translateHTML(pop);
  
  var self = this;
  pop.lasttime = 0;

  /*Bind events to each popup*/  
  pop.onmousedown = function(e) {
    if (!Status.freeze) {
      e.preventDefault(); //no select text when move & resize
    }

    if (e.button !== 0) return false;
    if ((e.timeStamp - this.lasttime) > 350) { /*One click*/
      /*increshe max z-index*/
      this.style.zIndex = Status.popz++; /*get max z-index*/
      this.movable = true; /*or move action other*/
      this.lasttime = e.timeStamp; /*save last click time*/
      this.xpage = Status.posx; /*save last page click coordinates*/
      this.ypage = Status.posy;
      action(this); /*move and resize action*/
      self.refocus(this);
    } else { /*Double click*/
      this.remove();
    }
  };

  pop.onmouseup = function(e) {
    this.movable = false; /*end movable state*/
    if (this.moving) {
      this.moving = false; /*stop moving state*/
      this.style.cursor = 'default';
    } else {
      self.viewswitch(this);
    }
    window.ondragstart = '';
  };

  var movedetect = function(element, tolerance) {
    /*Detection mouse move with tolerance*/
    var movex = Math.abs(Status.posx - element.xpage);
    var movey = Math.abs(Status.posy - element.ypage);
    if (element.movable && (movex > tolerance || movey > tolerance)) {
      element.moving = true; /*set movable status*/
    }
  };

  var action = function(element) {
    movedetect(element, 3); /*tolerance moving*/
    if (element.movable) {
      setTimeout(function() {
        action(element);
      }, 50);
    }
    /*avoid text drag*/
    window.ondragstart = function(e) {
      return false;
    };
    
    if (element.moving) {
      if (Status.resize) { /*resize popup*/
        //window.getSelection().empty();
        element.style.cursor = 'se-resize';
        element.style.width = (parseInt(element.style.width, 10) +
          (Status.posx - element.xpage)) + 'px';
        element.xpage = Status.posx; /*refresh last xpage mouse position*/
        element.style.height = (parseInt(element.style.height || element.clientHeight, 10) +
          (Status.posy - element.ypage)) + 'px';
        element.ypage = Status.posy; /*refresh last xpage mouse position*/
      } else if (Status.freeze) { /*Freeze and text selection*/
        element.style.cursor = 'auto';
      } else { /*Move popup*/
        //window.getSelection().empty();
        element.style.cursor = 'move';
        element.style.top = (parseInt(element.style.top, 10) +
          (Status.posy - element.ypage)) + 'px';
        element.style.left = (parseInt(element.style.left, 10) +
          (Status.posx - element.xpage)) + 'px';
        element.xpage = Status.posx;
        element.ypage = Status.posy;
      }
    }
  };
};

/*Switch translated/original text*/
View.prototype.viewswitch = function(el) {
  if (this.controler.model.viewtransl) {
    el.innerHTML = this.controler.model.original;
    el.classList.remove('translated');
    el.classList.remove('waiting');
    el.classList.add('original');
    el.title = this.controler.model.srclang.toUpperCase();
    el.lang = this.controler.model.srclang;
    this.controler.model.viewtransl = false;
  } else {
    el.innerHTML = this.controler.model.translated;
    el.classList.remove('original');
    el.classList.remove('waiting');
    el.classList.add('translated');
    el.lang = el.title = this.controler.model.trlang;
    el.title = this.controler.model.trlang.toUpperCase();
    this.controler.model.viewtransl = true;
  }
};



/*Get text from user selection range for translaion*/
View.prototype.selection = function () {
  var s = window.getSelection();
  if (s.type === 'Range') {
    return s.getRangeAt(0);
  } else {
    return false;
  }
};

/*Refresh focus information when need*/
View.prototype.refocus = function(element) {
  var focusedel = document.querySelectorAll('.focused-pop');
  if (focusedel.length > 0) {
    for (var i = 0; i < focusedel.length; i++) {
      focusedel[i].classList.remove('focused-pop');
    }
  }
  element.classList.add('focused-pop');
};

View.prototype.voice = function () {
  var el = document.getElementsByClassName('focused-pop')[0];
  if (!el) {
    return false;
  }
  /*get audio language*/
  var voicelang = el.lang;
  /*Get tts sms and urls urls*/
  var text = el.innerText.replace(/\s+/g,' ');
  var smss = this.controler.getttsparts(text, '100');
  var urls = this.controler.ttsurls(smss, voicelang);
  /*Create link ckick and blank window*/
  var link = document.createElement('a');
  link.href = '#tts-audio-start';
  link.rel = 'noreferrer';
  link.style.display = 'none';
  var x = parseFloat(el.style.left) + window.screenX;
  var y = parseFloat(el.style.top) + window.screenY;
  /*adio tts onclick*/
  link.onclick = function(e) {
    e.preventDefault();
    /*audio TTS popup window*/
    var ttswin = window.open('', '_blank', 'left=' +
      x + ', top=' + y + ', width=100, height=10O');
    /*insert audio and icon element element*/
    var audio = ttswin.document.createElement('audio');
    var h = ttswin.document.createElement('h1');
    h.style.color = 'yellow';
    h.style.width = '90px';
    h.style.textAlign = 'center';
    h.textContent = '((' + voicelang + '))';
    ttswin.document.body.appendChild(audio);
    ttswin.document.body.appendChild(h);
    ttswin.document.body.style.backgroundColor = 'black';
    ttswin.document.body.style.cursor = 'pointer';
    ttswin.document.body.title = chrome.i18n.getMessage('tts_title');
    ttswin.focus();
    ttswin.onclick = function(e) {
      if (e.button === 0) {
        this.close();
      }
    };
    audio.src = urls.shift();
    audio.load();
    audio.play();
    audio.addEventListener('ended', function() {
      audio.src = urls.shift();
      if (audio.src) {
        audio.load();
        audio.play();
      } else {
        ttswin.close();
      }
    });
  };
  link.click();
};
