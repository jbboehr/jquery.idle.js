
var Idle = $.idle.Idle;

function factory(options) {
  options = options || {};
  options.window = $('<textarea>');
  return new Idle(options);
}

test('$.idle', function() {
  expect(1);
  ok($.idle() instanceof Idle);
});

test('contruction and attach', function() {
  expect(8);
  var idle = factory();
  
  // attach
  ok(idle.attach !== Idle.prototype.attach);
  ok(idle.detach === Idle.prototype.detach);
  ok(idle.eventHandler);
  ok(idle.pollInterval);
  
  // detach
  idle.detach();
  ok(idle.attach === Idle.prototype.attach);
  ok(idle.detach !== Idle.prototype.detach);
  ok(!idle.eventHandler);
  ok(!idle.pollInterval);
});

asyncTest('timeout', function() {
  expect(2);
  var idle = factory({
    idleTimeout : 10,
    pollTimeout : 5
  });
  strictEqual(idle.state, 'active');
  
  setTimeout(function() {
    strictEqual(idle.state, 'idle');
    idle.detach();
    start();
  }, 40);
  
  
});

asyncTest('events', function() {
  expect(6);
  var idle = factory();
  var counter = 0;
  idle.on('idle', function() {
    strictEqual(++counter, 1);
  });
  idle.on('active', function() {
    strictEqual(++counter, 2);
  });
  
  setTimeout(function() {
    idle.eventHandler({ type : 'blur' });
    strictEqual(idle.lastSource, 'blur');
    strictEqual(idle.state, 'idle');
  }, 10);
  
  setTimeout(function() {
    idle.eventHandler({ type : 'focus' });
    strictEqual(idle.lastSource, 'focus');
    strictEqual(idle.state, 'active');
  }, 20);
  
  setTimeout(function() {
    idle.detach();
    start();
  }, 30);
});

asyncTest('intervals', function() {
  expect(2);
  var idle = factory({
    idleTimeout : 50,
    pollTimeout : 10
  });
  idle.eventHandler({ type : 'focus' });
  
  var nActive = 0, nIdle = 0;
  idle.setInterval(function(info) {
    info.state === 'active' ? nActive++ : nIdle++;
  }, 20, 20);
  
  setTimeout(function() {
    ok(nActive);
    ok(nIdle);
    idle.detach();
    start();
  }, 110);
});

asyncTest('clearInterval', function() {
  expect(1);
  var idle = factory({
    pollTimeout : 10
  });
  
  var run = 0;
  function fn() {
    run = 1;
  }
  idle.setInterval(fn, 1, 1).clearInterval(fn);
  
  setTimeout(function() {
    strictEqual(run, 0);
    start();
  }, 30);
});
