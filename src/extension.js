const Tweener = imports.ui.tweener;
const Meta = imports.gi.Meta;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

let _settings = null;
let _WindowState;
let _blurActor = null;

let _on_window_grab_begin, _on_window_grab_end;
let _on_move_changed, _on_resize_changed;

let _allowed_grab_operations = [];
let _grab_moving_operations = [
  Meta.GrabOp.MOVING,
  Meta.GrabOp.KEYBOARD_MOVING
];

let _grab_resizing_operations = [
  Meta.GrabOp.RESIZING_NW,
  Meta.GrabOp.RESIZING_N,
  Meta.GrabOp.RESIZING_NE,
  Meta.GrabOp.RESIZING_E,
  Meta.GrabOp.RESIZING_SW,
  Meta.GrabOp.RESIZING_S,
  Meta.GrabOp.RESIZING_SE,
  Meta.GrabOp.RESIZING_W,
  Meta.GrabOp.KEYBOARD_RESIZING_UNKNOWN,
  Meta.GrabOp.KEYBOARD_RESIZING_NW,
  Meta.GrabOp.KEYBOARD_RESIZING_N,
  Meta.GrabOp.KEYBOARD_RESIZING_NE,
  Meta.GrabOp.KEYBOARD_RESIZING_E,
  Meta.GrabOp.KEYBOARD_RESIZING_SW,
  Meta.GrabOp.KEYBOARD_RESIZING_S,
  Meta.GrabOp.KEYBOARD_RESIZING_SE,
  Meta.GrabOp.KEYBOARD_RESIZING_W
];

function init_grab_operations() {
  _allowed_grab_operations = [];
  if (_settings.get_boolean('transparent-on-moving')) {
    _allowed_grab_operations.push(..._grab_moving_operations);
  }

  if (_settings.get_boolean('transparent-on-resizing')) {
    _allowed_grab_operations.push(..._grab_resizing_operations);
  }
}

function is_grab_operation_allowed(grab_op) {
  return _allowed_grab_operations.indexOf(grab_op) > -1; 
}

function set_opacity(window_actor, target_opacity, on_complete, check_if_completed) {
  let transition_time = _settings.get_double('transition-time');

  let window_surface = get_window_surface(window_actor);
  let state = _WindowState[window_actor.meta_window.get_pid()];
  let thread = Date.now();
  state.thread = thread;

  let complete_func = function() { 
    state.thread = 0;
    if (on_complete) { 
      on_complete(); 
    }
  };

  if (transition_time < 0.001) {  	
    window_surface.opacity = target_opacity;
    complete_func();
  } else {
    Tweener.addTween(window_surface, {
        time: transition_time,
        transition: 'easeOutQuad',
        opacity: target_opacity,
        onComplete: complete_func
    });
    if (check_if_completed) {
      set_timeout(function() { 
        if (state && state.thread == thread){
          window_surface.opacity = target_opacity;
          complete_func();
        }
      }, transition_time * 1000 + 100); // repair opacity if the Tween was canceled
    }
  }
}

function set_blur(window_actor, meta_window, blurred) {
	if (blurred) {
		let sigma_value = _settings.get_int('blur-intensity');
		let blur = new Shell.BlurEffect({ sigma: sigma_value, mode: Shell.BlurMode.BACKGROUND });
		
		let frame = meta_window.get_frame_rect();
		
		log("frame width: " + frame.width + "window_actor width: " + window_actor.get_width());
		log("frame height: " + frame.height + "window_actor height: " + window_actor.get_height());
		
		let offsetX = window_actor.get_width() - frame.width;
		let offsetY = window_actor.get_height() - frame.height;
		
		let constraintPosX = new Clutter.BindConstraint({ source: window_actor, coordinate: Clutter.BindCoordinate.X, offset: offsetX / 2.0});
		let constraintPosY = new Clutter.BindConstraint({ source: window_actor, coordinate: Clutter.BindCoordinate.Y, offset: offsetY / 2.0 - 10});
		
		let constraintSizeX = new Clutter.BindConstraint({ source: window_actor, coordinate: Clutter.BindCoordinate.WIDTH, offset: -offsetX});
		let constraintSizeY = new Clutter.BindConstraint({ source: window_actor, coordinate: Clutter.BindCoordinate.HEIGHT, offset: -offsetY});
		
		_blurActor = new Clutter.Actor();
		_blurActor.add_constraint(constraintPosX);
		_blurActor.add_constraint(constraintPosY);
		_blurActor.add_constraint(constraintSizeX);
		_blurActor.add_constraint(constraintSizeY);
	   
		_blurActor.add_effect_with_name('blur-effect', blur);
		
		global.window_group.insert_child_below(_blurActor, window_actor);
    } else {
    	global.window_group.remove_actor(_blurActor);
    }
}

function set_timeout(func, time){
  GLib.timeout_add(GLib.PRIORITY_DEFAULT, time, function() {
    func();
    return false;
  });
}

function get_window_surface(window_actor) {
  var childs = window_actor.get_children();
  for (var i = 0; i < childs.length; i++) {
    if (childs[i].constructor.name.indexOf('MetaSurfaceActor') > -1) {
      return childs[i];
    }
  }

  return window_actor;
}

function window_grab_begin(meta_display, meta_screen, meta_window, meta_grab_op, gpointer) {
  if (!meta_window || !is_grab_operation_allowed(meta_grab_op)) {
    return;
  }

  let window_actor = meta_window.get_compositor_private();
  let pid = meta_window.get_pid();

  let state = _WindowState[pid];
  if (!state) {
    let window_surface = get_window_surface(window_actor);
    state = { thread: -1, original_opacity: window_surface.opacity }
    _WindowState[pid] = state;
  }
  
  if (_settings.get_boolean('blur')) {
		set_blur(window_actor, meta_window, true);
  }

  let opacity_value = _settings.get_int('window-opacity');
  set_opacity(window_actor, opacity_value);
}

function window_grab_end(meta_display, meta_screen, meta_window, meta_grab_op, gpointer) {
  if (!meta_window || !is_grab_operation_allowed(meta_grab_op)) {
    return;
  }

  let window_actor = meta_window.get_compositor_private();
  let pid = meta_window.get_pid();
  
  let state = _WindowState[pid];
  set_opacity(window_actor, state.original_opacity, function() { set_blur(window_actor, meta_window, false); delete _WindowState[pid]; }, true);
}

function enable() {
  _settings = Convenience.getSettings();
  init_grab_operations();
  _WindowState = {};
  _on_window_grab_begin = global.display.connect('grab-op-begin', window_grab_begin);
  _on_window_grab_end = global.display.connect('grab-op-end', window_grab_end);
  _on_move_changed = _settings.connect('changed::transparent-on-moving', init_grab_operations);
  _on_resize_changed = _settings.connect('changed::transparent-on-resizing', init_grab_operations);
}

function disable() {
  global.display.disconnect(_on_window_grab_begin);
  global.display.disconnect(_on_window_grab_end);
  _settings.disconnect(_on_move_changed);
  _settings.disconnect(_on_resize_changed);

  _WindowState = {};
  _settings.run_dispose();
}

function init() {
  Convenience.initTranslations();
}
