/********************************************/
/** Model **/
/********************************************/

var Status = {
  /*Global static object for mouse position, ctrl key and pop zindex*/
  posx: 0,
  posy: 0,
  popz: 999,
  popid: 10000,
  resize: false,
  freeze: false,
  options: {},
  disabled: false
};

var Model = function () {
  this.original = 'Translation working, please wait...';
  this.translated = 'Na překladu se pracuje, čekejte prosím...';
  this.viewtransl = true;
  this.srclang = '';
  this.trlang = '';
};

/*Realtime global mouse position for to static object Status*/
window.onmousemove = function(e) {
  Status.posx = e.x;
  Status.posy = e.y;
};

/*Realtime global scrollY and scrollY of window*/
window.onscroll = function(e) {
  Status.scrollX = window.scrollX;
  Status.scrollY = window.scrollY;
  var fpops = document.getElementsByClassName('translate-pop');
  if (fpops[0]) { /*scrolling position fixed popups hack*/
    for (var i = 0; i < fpops.length; i++) {
      var pop = fpops[i];
      pop.scxdiff = Status.scrollX - pop.scx;
      pop.scydiff = Status.scrollY- pop.scy;
      pop.style.left = parseFloat(pop.style.left) - pop.scxdiff + 'px';
      pop.style.top = parseFloat(pop.style.top) - pop.scydiff + 'px';
      pop.scx = Status.scrollX;
      pop.scy = Status.scrollY;
    }
  }
};