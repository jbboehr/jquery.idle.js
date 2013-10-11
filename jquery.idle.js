/*!
 * jQuery Idle Plugin
 * https://github.com/jbboehr/jquery.idle.js
 * 
 * Copyright 2013 John Boehr
 * Released under the MIT license
 */
(function(factory) {
  if( typeof define === 'function' && define.amd ) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals.
    factory(jQuery);
  }
}(function($) {
  
  /* global $:false, jQuery:true, console:true */
  
  // Defaults
  
  var defaults = {
    /**
     * Window events to trigger active state
     */
    activeEvents : 'focus scroll keydown mousedown mousemove',
    
    /**
     * Logs event and interval information to console
     */
    debug : false,
    
    /**
     * Window events to trigger idle state
     */
    idleEvents : 'blur',
    
    /**
     * Milliseconds of inactivity before considering idle
     */
    idleTimeout : 60000,
    
    /**
     * Function to use to log debug information
     */
    log : undefined,
    
    /**
     * Milliseconds between checking of event registers and intervals
     */
    pollTimeout : 2000,
    
    /**
     * Proxies the active and idle events to the window object
     */
    proxyToWindow : false,
    
    /**
     * Object to use as the window for event registration and proxyToWindow
     */
    window : undefined
  };
  
  
  
  // Private static
  
  /**
   * Singleton instance
   */
  var instance;
  
  /**
   * Last event object for an active-type event
   */
  var lastActiveEvent;
  
  /**
   * Last event object for an idle-type event
   */
  var lastIdleEvent;
  
  /**
   * Current number of instances. Used to enable/disable event registers
   * for more CPU intensive events such as mousemove
   */
  var refCount = 0;
  
  /**
   * Stores the states that were registered
   */
  var registeredActiveTypes;
  var registeredIdleTypes;
  
  /**
   * Returns the current date time in milliseconds
   */
  var now = (Date.now || function() {
    return (new Date()).getTime();
  });
  
  
  /**
   * Callback for active-type events
   */
  function onActiveEvent(event) {
    event.ts = now();
    lastActiveEvent = event;
  }
  
  /**
   * Callback for idle-type events
   */
  function onIdleEvent(event) {
    event.ts = now();
    lastIdleEvent = event;
  }
  
  /**
   * Increment the reference counter and register events if necessary
   */
  function refIncr() {
    if( ++refCount === 1 ) {
      $(window).on(registeredActiveTypes = defaults.activeEvents, onActiveEvent);
      $(window).on(registeredIdleTypes = defaults.idleEvents, onIdleEvent);
    }
  }
  
  /**
   * Decrement the reference counter and unregister events if necessary
   */
  function refDecr() {
    if( --refCount === 0 ) {
      $(window).off(registeredActiveTypes, onActiveEvent);
      $(window).off(registeredIdleTypes, onIdleEvent);
    }
  }
  
  
  
  // Private
  
  /**
   * Changes the state
   */
  function changeState(state) {
    if( this.state !== state ) {
      this.log(this.state, ' -> ', state, '(', this.lastSource, ')', '(', this.lastReason, ')');
      //this.lastSource = null, this.lastReason = null;

      this.state = state;
      this.trigger(state);

      // Set new lasts
      this.lastState = state;
      this.lastTime = now();
    }
    return this;
  }
  
  /**
   * Checks if the state should change
   */
  function check() {
    if( this.lastActivity > this.lastInactivity ) {
      if( this.lastActivity + this.options.idleTimeout < now() ) {
        this.lastReason = 'timeout',
        changeState.call(this, 'idle');
      } else {
        this.lastReason = 'activity';
        changeState.call(this, 'active');
      }
    } else {
      this.lastReason = 'inactivity';
      changeState.call(this, 'idle');
    }
    return this;
  }
  
  /**
   * Handler for focus/blur events (only)
   */
  function eventHandler(event) {
    this.lastSource = event.type;
    if( event.type === 'blur' ) {
      this.lastInactivity = now();
    } else {
      this.lastActivity = now();
    }
    this.log(event.type, this.lastActivity, this.lastInactivity);
    check.call(this);
  }
  
  /**
   * Poll logic. Checks activity from global event registers and 
   * executes interval callbacks
   */
  function poll() {
    this.log('poll start');
    
    // Check global event registers
    if( lastActiveEvent && 
        lastActiveEvent.ts > this.lastActivity &&
        (!lastIdleEvent || lastIdleEvent.ts < lastActiveEvent.ts) ) {
      this.lastActivity = lastActiveEvent.ts;
      this.lastSource = lastActiveEvent.type;
    } else if( lastIdleEvent && 
      lastIdleEvent.ts > this.lastInactivity &&
        (!lastActiveEvent || lastActiveEvent.ts < lastIdleEvent.ts) ) {
      this.lastInactivity = lastIdleEvent.ts;
      this.lastSource = lastIdleEvent.type;
    } else {
      this.lastSource = 'poll';
    }

    // Run check
    check.call(this);

    // Do intervals
    var ts = now(), c;
    for( var i in this.intervals ) {
      c = this.intervals[i];
      if( c.activeInterval && 
          this.state === 'active' &&
          c.last + c.activeInterval <= ts ) {
        c.fn({
          instance : this,
          interval : c.activeInterval,
          last : c.last,
          state : this.state,
          timeSince : ts - c.last
        });
        c.last = ts;
      }
      if( c.idleInterval && 
          this.state === 'idle' &&
          c.last + c.idleInterval <= ts ) {
        c.fn({
          instance : this,
          interval : c.idleInterval,
          last : c.last,
          state : this.state,
          timeSince : ts - c.last
        });
        c.last = ts;
      }
    }
  }
  
  
  
  // Public
  
  /**
   * Constructor
   */
  var Idle = function(options) {
    this.options = $.extend({}, defaults, options);
    this.$win = $(this.options.window || window);
    this.log = (this.options.debug ? 
        this.options.log || $.proxy(console.log, console) : 
        false) || function() {};
    this.lastActivity = now();
    this.lastInactivity = 0;
    this.lastTime = 0;
    this.lastState = 'active';
    this.state = 'active';
    this.events = {};
    this.events.active = [];
    this.events.idle = [];
    this.intervals = [];
    this.intervalID = 0;
    this.attach();
    
    if( this.options.proxyToWindow ) {
      this.on = $.proxy(this.$win.on, this.$win);
      this.off = $.proxy(this.$win.off, this.$win);
    }
  };
  
  /**
   * Prototype
   */
  Idle.prototype = {
    /**
     * Attach events and intervals
     */
    attach : function() {
      // Naughty stuff
      this.attach = function() { return this; };
      this.detach = Idle.prototype.detach;
      
      // Attach
      this.eventHandler = $.proxy(eventHandler, this);
      this.$win.on('blur focus', this.eventHandler);

      refIncr();

      this.pollInterval = setInterval($.proxy(poll, this), 
          this.options.pollTimeout || 1000);
          
      return this;
    },

    /**
     * Detach events and intervals
     */
    detach : function() {
      // Naughty stuff
      this.attach = Idle.prototype.attach;
      this.detach = function() { return this; };
      
      this.$win.off('blur focus', this.eventHandler);
      this.eventHandler = undefined;

      refDecr();

      clearInterval(this.pollInterval);
      this.pollInterval = undefined;

      this.off('active');
      this.off('idle');

      return this;
    },



    // Events

    /**
     * Register an event. type may be 'active' or 'idle'
     */
    on : function(type, fn) {
      (type in this.events) || (this.events[type] = []);
      this.events[type].push(fn);
      return this;
    },

    /**
     * Unregister an event. type may be 'active' or 'idle'
     */
    off : function(type, fn) {
      if( type in this.events ) {
        if( !fn ) {
          delete this.events[type];
        } else {
          for( var i = 0, l = this.events[type].length; i < l; i++ ) {
            if( this.events[type][i] === fn ) {
              this.events[type].splice(i, 1);
              i--, l--;
            }
          }
          if( this.events[type].length === 0 ) {
            delete this.events[type];
          }
        }
      }
      return this;
    },

    /**
     * Trigger an event. type may be 'active' or 'idle'
     */
    trigger : function(type) {
      var data = {
        instance : this,
        type : type,
        lastTime : this.lastTime,
        lastState : this.lastState,
        timeSince : (this.lastTime ? now() - this.lastTime : 0)
      };
      if( this.options.proxyToWindow ) {
        this.$win.trigger(data);
      } else if( type in this.events ) {
        $.each(this.events[type], function(index, fn) {
          fn(data);
        });
      }
      return this;
    },



    // Intervals

    /**
     * Clears an interval. Accepts an ID or the original function passed to
     * setInterval
     */
    clearInterval : function(id) {
      if( typeof(id) === 'function' ) {
        for( var i in this.intervals ) {
          if( this.intervals[i].fn === id ) {
            delete this.intervals[i];
          }
        }
      } else {
        delete this.intervals[id];
      }
      return this;
    },

    /**
     * Sets an interval. Accepts a callback, an interval while active, and an
     * optional interval while idle
     */
    setInterval : function(fn, activeInterval, idleInterval) {
      this.lastIntervalID = this.intervalID++;
      this.intervals[this.lastIntervalID] = {
        fn : fn,
        activeInterval : activeInterval,
        idleInterval : idleInterval,
        last : now()
      };
      return this;
    }
    
  }; // End Idle.prototype
  
  
  
  // jQuery
  
  /**
   * Gets singleton. First call may set options. Second parameter to true
   * to create a new instance. Only singleton instance may be accessed through
   * $.idle()
   */
  $.idle = function(opts, newInstance) {
    return newInstance ? 
        new Idle(opts) :
        (instance || (instance = (new Idle(opts))));
  };
  
  /**
   * Store reference in case someone wants to play with it
   */
  $.idle.Idle = Idle;
  
  /**
   * Store reference to defaults object. Yeah, don't replace the object.
   */
  $.idle.defaults = Idle.defaults = defaults;
  
  
  
  return $.idle;
}));
