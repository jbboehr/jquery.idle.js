# jquery.idle.js

Monitors browser window for activity. Example use cases: polling server less 
frequently, closing persistent connections, or not running more intensive 
code while the browser window is inactive.

## Usage

### Events

Executes callbacks when the window becomes idle or active.

```js
// Register events
$.idle().on('active', function(info) {
  // Do something when the user becomes active
}).on('idle', function(info) {
  // Do something when the user becomes idle
});

// Unregister events (does not support 'active idle' syntax)
var fn = function(info) {};
$.idle().on('active', fn)
        .on('idle', fn);
$.idle().off('active', fn)
        .off('idle', fn);
```

Info passed to callback

```json
{
  // instance event was registered to
  instance : {},
  // the event type / current state (active|idle)
  type : 'active',
  // time of last state change
  lastTime : 0,
  // the previous state
  lastState : 'idle',
  // milliseconds since last state change
  timeSince : 0
}
```

### Intervals

Similar to setInterval and clearInterval, except it returns the
idle object for method chaining and accepts two times: the first is the the 
interval while the window is active, the second is the interval while the window
is idle. Either interval may be omitted or passed a false-y value to disable
calling the callback for that state.

```js
// Execute every two seconds while the window is active, sixty seconds
// while the window is idle
$.idle().setInterval(function(info) {
  // Do something
}, 2000, 60000);

// Clears the last interval
$.idle().clearInterval($.idle().lastIntervalID);

// Clears an interval by function
var fn = function(info) {};
$.idle().setInterval(fn, 2000);
$.idle().clearInterval(fn);
```

Info passed to callback:
```json
{
  // instance callback was registered to
  instance : {},
  // the interval for the current state
  interval : 2000,
  // last time it was executed
  last : 0, 
  // the current state (active|idle)
  state : 'active',
  // milliseconds since last execution
  timeSince : 0 
}
```

### Current state

```js
$.idle().state
```

## Todo

- Unit tests
- More extensive cross-browser testing
- Reference counters for on/off and set/clearInterval to register/unregister events

## License

This project is licensed under the [MIT license](http://opensource.org/licenses/MIT).
