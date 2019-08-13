(function(window, document) {
  'use strict';
  var core = window.core;
  var T = window.THREE;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;


  var renderer, scene, camera, effect, controls, light;

  var ground, ambientLight;

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

  ambientLight = new T.AmbientLight(0xf0f0f0, 0.2);
  scene.add(ambientLight);

  var tvWidth = 50;
  var tvDepth = 20;
  var tvHeight = tvWidth * 0.75;
  var legWidth = 3;
  var legDepth = 3;
  var legHeight = 10;

  var tvPosY = (tvHeight / 2) + legHeight  - 10;
  var legPosY = -((tvHeight / 2) + (legHeight / 2));

  var legPosFrontZ = (tvDepth / 2) - (legDepth / 2);
  var legPosBackZ = -((tvDepth / 2) - (legDepth / 2));
  var legPosLeftX = -(tvWidth / 2) + (legWidth / 2);
  var legPosRightX = ((tvWidth / 2) - (legWidth / 2));


  var woodTexture = new T.ImageUtils.loadTexture('woodTexture.jpg');

  var tv = core.build(
    'CubeGeometry',
    [tvWidth, tvHeight, tvDepth],
    'MeshLambertMaterial',
    [{
      map: woodTexture
    }]
  );

  var leg = core.build(
    'CubeGeometry',
    [legWidth, legHeight, legDepth],
    'MeshLambertMaterial',
    [{
      map: woodTexture
    }]
  );

  var leg1 = leg.clone(); // FL
  leg1.position.z = legPosFrontZ;
  leg1.position.y = legPosY;
  leg1.position.x = legPosLeftX;
  tv.add(leg1);
  var leg2 = leg.clone(); // FR
  leg2.position.z = legPosFrontZ;
  leg2.position.y = legPosY;
  leg2.position.x = legPosRightX;
  tv.add(leg2);
  var leg3 = leg.clone(); // BL
  leg3.position.z = legPosBackZ;
  leg3.position.y = legPosY;
  leg3.position.x = legPosLeftX;
  tv.add(leg3);
  var leg4 = leg.clone(); // BR
  leg4.position.z = legPosBackZ;
  leg4.position.y = legPosY;
  leg4.position.x = legPosRightX;
  tv.add(leg4);

  tv.position.y = tvPosY;
  tv.position.z = -50;
  tv.position.x = 10;
  tv.lookAt(new T.Vector3(-10, tvPosY, 0));
  scene.add(tv);
  tv.castShadow = true;

  var tubeWidth = tvWidth - 10;
  var tubeHeight = tvHeight - 10;

  var videoMonitor, videoImage, videoImageContext, videoTexture;
  // Create a texture from getUserMedia
  var vWidth = 320;
  var vHeight = 240;
  videoMonitor = document.createElement('video');
  videoMonitor.width = vWidth;
  videoMonitor.height = vHeight;
  videoImage = document.createElement('canvas');
  videoImage.width = vWidth;
  videoImage.height = vHeight;

  var sources = [];
  if (typeof MediaStreamTrack !== 'undefined') {
    // Good we've got MediaStreamTrack...
    window.MediaStreamTrack.getSources(function (sourcesInfo) {
      sourcesInfo.forEach(function (info) {
        if (info.kind === 'video') {
          sources.push({
            id: info.id,
            label: info.label
          });
        }
      });
    });
  }
  var startVideo = function (sourceId) {
    navigator.getUserMedia(
      {
        video: {
          facingMode: {
            exact: "environment"
          }
        },
        optiona: [{
          sourceId: sourceId
        }]
      },
      function (stream) {
        videoMonitor.src = window.URL.createObjectURL(stream);

        videoMonitor.onloadedmetadata = function () {
          videoMonitor.play();
        };
      },
      function () {
        // shh bby its ok
      }
    );
  };

  videoImageContext = videoImage.getContext('2d');
  videoImageContext.fillStyle = '#fff';
  videoImageContext.fillRect(0, 0, vWidth, vHeight);

  videoTexture = new T.Texture(videoImage);
  videoTexture.minFilter = T.LinearFilter;
  videoTexture.maxFilter = T.LinearFilter;

  var tubeMaterial = new T.MeshBasicMaterial({
    map: videoTexture,
    overdraw: true,
    side: T.DoubleSide
  });

  var tubeGeometry = new T.PlaneBufferGeometry(tubeWidth, tubeHeight, 1, 1);

  var tube = new T.Mesh(tubeGeometry, tubeMaterial);

  tube.position.z = (tvDepth / 2) + 0.2;
  tv.add(tube);

  camera.lookAt(tube.position);



  var waitforsources = setInterval(function () {
    if (sources.length) {
      buildRemote(sources);
      clearInterval(waitforsources);
    }
  }, 100);

  var buildRemote = function (sources) {
    var remote = core.build(
      'CubeGeometry',
      [30, 5, 15],
      'MeshLambertMaterial',
      [{
        color: 0x555555
      }]
    );
    remote.castShadow = true;

    sources.forEach(function(source, i) {
      var button = core.build(
        'CubeGeometry',
        [6, 2, 8],
        'MeshLambertMaterial',
        [{
          color: 0xff0000
        }]
      );
      var xspace = 4;
      var xoffset = ((6 + xspace) * (i + 1)) - 12;
      button.position.set(xoffset, 2, 0);

      remote.add(button);

      button.ongazelong = function () {
        setTimeout(function () {
          startVideo(sources[i].id);
          button.material.color.setHex(0xffff00);
        }, 1000);
      };
      button.ongazeover = function () {
        button.material.color.setHex(0x00ff00);
      };
      button.ongazeout = function () {
        button.material.color.setHex(0xff0000);
      };
      reticle.add_collider(button);
    });

    remote.rotation.y = 45 * (Math.PI / 180);
    remote.rotation.x = -10 * (Math.PI / 180);
    remote.rotation.z = 40 * (Math.PI / 180);
    remote.position.set(5, 0, 20);

    scene.add(remote);
  };









  var lampx = 20;
  var lampy = 30;
  var lampz = 20;


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

    controls.update();
    requestAnimationFrame(animateRenderer);

    if (videoMonitor.readyState === videoMonitor.HAVE_ENOUGH_DATA) {
      videoImageContext.drawImage(videoMonitor, 0, 0, vWidth, vHeight);
      if (videoTexture) {
        videoTexture.needsUpdate = true;
      }
    }

    reticle.reticle_loop();
    effect.render(scene, camera);
  };
  animateRenderer();
  window.addEventListener('resize', function() {
    core.resizeRenderer(renderer, scene, camera, effect);
  }, false);

}(window, document));
