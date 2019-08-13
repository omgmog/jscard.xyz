(function(window, document) {
  'use strict';
  var core = window.core;
  var T = window.THREE;

  var renderer, scene, camera, effect, controls;

  var cube, ground, ambientLight, light, bulb;

  scene = new T.Scene();
  camera = core.setCameraOptions();
  var reticle = window.vreticle.Reticle(camera);
  if (core.isPocketDevice()) {
    camera.position.set(0, 20, 20);
  } else {
    camera.position.set(0, 40, 120);
  }
  scene.add(camera);

  renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setSize(core.options.width, core.options.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  document.body.appendChild(renderer.domElement);
  controls = core.setControllerMethod(camera, renderer.domElement);

  effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.focalLength = 25;
  effect.setSize(core.options.width, core.options.height);

  var groundTexture = T.ImageUtils.loadTexture('grid.png');
  groundTexture.wrapS = groundTexture.wrapT = T.RepeatWrapping;
  groundTexture.repeat.set(1000, 1000); // Number of times to repeat texture
  groundTexture.anisotropy = renderer.getMaxAnisotropy();
  ground = core.build(
    'PlaneBufferGeometry', [2000, 2000, 100],
    'MeshLambertMaterial', [{
      color: 0x222222,
      map: groundTexture
    }]
  );
  ground.position.y = -10;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  cube = core.build(
    'BoxGeometry', [10, 10, 10],
    'MeshPhongMaterial', [{
      color: 0xdd0000,
      shading: T.FlatShading,
    }]
  );
  cube.position.set(0, 10, 0);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  ambientLight = new T.AmbientLight(0xf0f0f0, 0.2);
  scene.add(ambientLight);

  var lampx = 0;
  var lampy = 20;
  var lampz = -10;

  bulb = core.build(
    'SphereGeometry', [0.5, 20, 20],
    'MeshPhongMaterial', [{
      color: 0xffff00,
      shading: T.FlatShading,
    }]
  );
  bulb.position.set(lampx, lampy, lampz);
  scene.add(bulb);

  camera.lookAt(bulb.position);

  light = new T.DirectionalLight(0xffffff, 1);
  light.color.setHSL(0.1, 1, 0.95);
  light.position.set(lampx, lampy, lampz);
  light.position.multiplyScalar(40);
  light.castShadow = true;

  // Increase size for sharper shadows
  light.shadowMapWidth = 1024;
  light.shadowMapHeight = 1024;

  var d = 256;

  light.shadowCameraLeft = -d;
  light.shadowCameraRight = d;
  light.shadowCameraTop = d;
  light.shadowCameraBottom = -d;

  light.shadowCameraFar = 3500;
  light.shadowBias = -0.0001;

  // light.shadowCameraVisible = true;
  scene.add(light);

  var cancelHover = [];
  var backDevice = core.addBackDevice([-60, 0, -30]);
  backDevice.ongazeover = function () {
    if (cancelHover[0]) {
      clearTimeout(cancelHover[0]);
    }
    backDevice.children[0].material.visible = true;
    backDevice.material.color.setHex(0x00ff00);
  };
  backDevice.ongazeout = function () {
    if (cancelHover[0]) {
      clearTimeout(cancelHover[0]);
    }
    cancelHover[0] = setTimeout(function () {
      backDevice.children[0].material.visible = false;
      backDevice.material.color.setHex(0xff0000);
    }, 250);
  };
  backDevice.ongazelong = function () {
    setTimeout(function () {
      window.location.href = '../menu.html';
    }, 1000);
  };
  reticle.add_collider(backDevice);

  scene.add(backDevice);


  var animateRenderer = function() {
    cube.rotation.x += 0.04;
    cube.rotation.y += 0.02;

    controls.update();

    reticle.reticle_loop();
    effect.render(scene, camera);
    requestAnimationFrame(animateRenderer);
  };
  animateRenderer();
  window.addEventListener('resize', function() {
    core.resizeRenderer(renderer, scene, camera, effect);
  }, false);

}(window, document));
