/**
 * CountTimer
 * Cross-page persistent timers, storing its state in cookies
 * Can't be used with user cookies disabled
 * You must call CountTimer.stop(id) to stop persistent timer.
 * Otherwise it will stop only after 24hours or CountTimer.cleanup() call
 * @require common.css
 * @example
 * //initial page
 * <body onload="CountTimer.run('1','[timer]',60,5)">
 * <div timer></div>
 * </body>
 * //ordinary page
 * <body onload="CountTimer.run('1','[timer]')">
 * <div timer></div>
 * </body>
 * //finish page
 * <body onload="CountTimer.run('1'); document.getElementById('result').innerHTML=CountTimer.stop()">
 * <div timer></div>
 * </body>
 */
var CountTimer = (function() {
  //settings
  var cookieStart = 'count_timer_start';
  var cookieNotify = 'count_timer_notify';
  var cookieTime = 'count_timer_amount';
  var cookieHidden = 'count_timer_hidden';
  var timeout = 24*60;//in minutes. Time for timer to expire anyway.
  //methods
  function setCookie(name, value, expminutes) {
    var expires = new Date();
    expires.setSeconds(expires.getSeconds()+Math.round(expminutes*60));
    document.cookie = name+"="+encodeURIComponent(value)+";path=/;expires="+expires.toUTCString();
  }
  function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }
  function Timer(id, resultSelector, countMinutes /* minutes */, notifyMinutes /* minutes */) {
    this.id = id;
    this.resultSelector = resultSelector;
    //cookie stored params
    this.initialTime = getCookie(cookieStart+id) && new Date(getCookie(cookieStart+this.id)) || 
      countMinutes && new Date() || null;
    if(!this.initialTime) return;
    this.notifyMinutes = notifyMinutes || getCookie(cookieNotify+this.id) || 0;
    this.countMinutes = countMinutes || getCookie(cookieTime+this.id);
    this.hiddenStatus = getCookie(cookieHidden+this.id) || '';
    setCookie(cookieStart+this.id, this.initialTime, timeout);
    setCookie(cookieNotify+this.id, this.notifyMinutes, timeout);
    setCookie(cookieTime+this.id, this.countMinutes, timeout);
    setCookie(cookieHidden+this.id, this.hiddenStatus, timeout);
    //calculated params
    this.end = new Date(this.initialTime.getTime() + this.countMinutes*60*1000);
    this.notify = new Date(this.end.getTime() - this.notifyMinutes*60*1000);
    return this;
  }
  Timer.prototype.start = function() {
    if(!this.initialTime) return this;
    var timer = this;
    this.timerFunc = setInterval(function(){ timer.tick(); },1000);
    this.render();
    return this;
  }
  Timer.prototype.currentSeconds = function() {
    if(!this.initialTime) return 0;
    var time = this.end - new Date();
    return Math.round((time >=0 ? time : (new Date() - this.end))/1000);
  }
  Timer.prototype.toString = function() {
    if(!this.initialTime) return '';
    var date = new Date(null);
    date.setSeconds(this.currentSeconds());
    if(this.countMinutes < 60)
      return date.toISOString().substr(14, 5);
    else
      return date.toISOString().substr(11, 8);
  }
  Timer.prototype.toggle = function() {
    this.hiddenStatus = this.hiddenStatus ? '' : '1';
    setCookie(cookieHidden+this.id, this.hiddenStatus, timeout);
    this.show();
  }
  Timer.prototype.render = function() {
    if(!this.initialTime || !this.resultSelector) return;
    document.querySelector(this.resultSelector).innerHTML = 
    "<div count-timer "+(this.hiddenStatus?'count-timer_hidden':'')+"><div count-timer__button><button onclick=\"CountTimer.toggle('"+this.id+"')\"></button></div><div count-timer__result>"+this+"</div></div>";
  }
  Timer.prototype.show = function() {
    if(!this.initialTime || !this.resultSelector) return;
    document.querySelector(this.resultSelector+' [count-timer__result]').innerHTML = this.toString();
    var timer = document.querySelector(this.resultSelector+' [count-timer]');
    if(this.hiddenStatus) {
      timer.setAttribute('count-timer_hidden','');
    }
    else {
      timer.removeAttribute('count-timer_hidden');
    }
    
  }
  Timer.prototype.tick = function() {
    if(!this.initialTime) return;
    var now = new Date();
    if(0 <= (this.notify - now) &&(this.notify - now) < 1000) {
      alert("It's left less than "+this+"sec.");
    }
    this.show();
  }
  Timer.prototype.stop = function() {
    if(!this.initialTime) return '';
    clearInterval(this.timerFunc);
    setCookie(cookieStart+this.id,'',-1);
    setCookie(cookieNotify+this.id,'',-1);
    setCookie(cookieTime+this.id,'',-1);
    setCookie(cookieHidden+this.id,'',-1);
    return this.toString();
  }
  var timers = {};
  return {
    /** @method
     * @name run
     * @arg {string} ID of timer to handle
     * @arg {string} CSS Selector of container of timer template. If not supplied - no output will be done.
     * @arg {number} number of minutes to count down. Actual for first in-browser call only.
     * @arg {number} number of minutes before end of countdown to notify user. Actual for first in-browser call only.
     * @description Initializes timer object, restores cookie-saved parameters, draws it, and refreshes it each second
     */
    run : function(id, resultSelector, countMinutes /* minutes */, notifyMinutes /* minutes */) {
      timers[id] = new Timer(id, resultSelector, countMinutes, notifyMinutes).start();
    },
    /** @method
     * @name cleanup
     * @description Prepares user environment for working with timer, clears unfinished sessions. May be called at root of site.
     */
    cleanup : function() {
      var matches;
      while(matches = document.cookie.match(new RegExp(
      "(?:^|; )((?:" + cookieStart +"|"+cookieNotify+"|"+cookieTime+"|"+ cookieHidden +")[^=]*)=([^;]*)"))) {
        setCookie(matches[1],'',-1);
      }
    },
    /**
     * @method
     * @name stop
     * @arg {string} id of timer to stop
     * @return {string} Value of timer HH:MM:SS 
     * @description Clean up method. Stops timer, clears cookies, and returns final time
     */
    stop : function(id) {
      if(!timers[id]) {
        this.run(id);
      }
      return timers[id].stop();
    },
    /**
     * @method
     * @name toggle
     * @param {string} id of timer to toggle
     * @param {HTMLElement} Element to switch attribute
     * @description Switches special attribute 'count-timer_hidden' on element 
     */
    toggle : function(id, c) {
      if(!timers[id]) {
        this.run(id);
      }
      timers[id].toggle();
    }
  }
})();