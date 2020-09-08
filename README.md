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
## Future plans
I am working on building a new extension that allows you to selectively blur behind windows all the time as well as this transparent window moving etc.

## Installation from git
```bash
git clone https://github.com/CorvetteCole/transparent-window-moving.git
cd transparent-window-moving
make install
```
* Hit ```<Alt> + F2``` and type ```r``` and hit ```<Enter>```
* Enable the extension in ```gnome-tweak-tool```
* You can configure opacity, animation time and when the window should be transparent. 
