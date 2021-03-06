# jscard.xyz
## These demos haven't been updated since 2015... so YMMV


![](https://i.imgur.com/lVmV3DH.png)

## What the?

[jscard.xyz](https://blog.omgmog.net/jscard.xyz) is a collection of Javascript-powered VR demos that I've made for Google Cardboard.

Right now, they only work in a very specific configuration: **Chrome on Android**

They don't even work in all versions of Android (as [deviceorientation is broken in Chrome on Android 6.0 on the Nexus 5](https://code.google.com/p/chromium/issues/detail?id=540629).)

You can find the source for these demos [here](https://github.com/omgmog/talk-jsoxford-20-minutes-into-the-future/tree/master/demos), but eventually I'll polish my demos enough and put them (along with the full website) up here.

---

## HELP!

If you're having any problems, let me know through the issues on this repository.

### Everything is grey in my world!

By default the camera is looking towards the "floor". If you're on Chrome on a computer, you'll need to drag around to look.

---

## What's included?

Currently there are 4 (5 including the menu!) demos:

### Basic VR
> You find yourself in a room with a mysterious spinning cube in front of you.

This is as basic as it comes. If you can see stereoscopically maybe it will look sort of realistic.

### Look Interaction
> Find the small food icon that matches the big food icon.

The wrong/right noises are annoying, but there are only 4 levels, so you shouldn't have to bear it for too long.

### Using GetUserMedia
> Be amazed as your camera feed is shown on a Realistic* television in VR

\* Okay it's not that realistic, but you get the idea.

One small detail here is that switching media sources doesn't seem to work, so this demo is pretty useless as your front-facing camera will probably be selected.

### Spacial Audio
> As you look around you, the audio moves from one channel to the other.

If you look at the ground, you can make it really loud too.
