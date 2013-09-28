
var Idle = $.idle.Idle;

function factory() {
  return new Idle({
    window : $('<textarea>')
  });
}

test('$.idle', function() {
  expect(1);
  ok($.idle() instanceof Idle);
});

test('contruction and attach', function(){
  expect(3);
  var idle = factory();
  
  // attach
  ok(idle.attach !== Idle.prototype.attach);
  ok(idle.detach === Idle.prototype.detach);
  ok(idle.eventHandler);
//  idle.$win.trigger('blur');
//  strictEqual(idle.lastSource, 'blur');
//  idle.$win.trigger('focus');
//  strictEqual(idle.lastSource, 'focus');
});