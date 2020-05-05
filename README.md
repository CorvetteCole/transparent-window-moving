# transparent-window-moving
Now with added blur! - Cole

GNOME Shell Extension. 

Makes the window semi-transparent and blurred when moving or resizing.

Should be compatible with other extensions that change the transparency of windows.

Inspired by GhostWin application.

## Blur info
Here are the notable bits of code that do blur things:

```
let blur = new Shell.BlurEffect({ sigma: 10, mode: Shell.BlurMode.BACKGROUND });
window_actor.add_effect_with_name('blur-effect', blur); 
  
window_actor.remove_effect_by_name('blur-effect');
```

## Help needed
The problem right now is that the blur also applied to the shadow of windows which looks terrible.

As verdre in the irc mentioned:
"the only thing you can do about this is probably creating a custom actor that tracks the windows position and size and uses the reactangle without the shadow part.

You can get that rectangle by using MetaWindow.get_frame_rect() https://developer.gnome.org/meta/stable/MetaWindow.html#meta-window-get-frame-rect"

I have very little idea how to do this but I am going to bang my head against the wall learning everything until it works. Would be nice if anybody else had any ideas on how to get this going too. Once we have this working I will be building a new extension that allows you to selectively blur behind windows all the time as well as this transparent window moving etc.

## Installation from git
```bash
git clone https://github.com/CorvetteCole/transparent-window-moving.git
cd transparent-window-moving
make install
```
* Hit ```<Alt> + F2``` and type ```r``` and hit ```<Enter>```
* Enable the extension in ```gnome-tweak-tool```
* You can configure opacity, animation time and when the window should be transparent. 
