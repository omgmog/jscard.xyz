(function(window, document) {
  'use strict';
  var core = window.core;
  var T = window.THREE;

  var renderer, scene, camera, effect, controls;

  var speaker, ground, ambientLight, soundIndicator, light;

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

  var woodTexture = new T.ImageUtils.loadTexture('woodTexture.jpg');

  var speakerMaterials, speakerMaterialsArray = [];

  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // left
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // right
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // top
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // bottom
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // back
  speakerMaterialsArray.push(new T.MeshLambertMaterial({map: new T.ImageUtils.loadTexture('speaker.jpg')})); // front

  speakerMaterials = new T.MeshFaceMaterial(speakerMaterialsArray);

  speaker = new T.Mesh(
    new T.CubeGeometry(20, 40, 20, 1, 1, 1),
    speakerMaterials
  );



  speaker.position.set(0, 10, -40);
  speaker.rotation.y = -Math.PI;
  speaker.castShadow = true;
  speaker.receiveShadow = true;
  scene.add(speaker);

  ambientLight = new T.AmbientLight(0xf0f0f0, 0.2);
  scene.add(ambientLight);






  var lampx = 20;
  var lampy = 30;
  var lampz = -20;


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

  var playDevice = core.build('CubeGeometry', [30, 15, 10], 'MeshLambertMaterial', [{map: woodTexture}]);
  playDevice.position.set(35, 0, -20);
  playDevice.castShadow = true;


  var buttonMaterials, buttonMaterialsArray = [];

  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // left
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // right
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // top
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // bottom
  buttonMaterialsArray.push(new T.MeshLambertMaterial({
    map: new T.ImageUtils.loadTexture('playButton.jpg'),
    color: 0xff0000
  })); // front
  buttonMaterialsArray.push(new T.MeshLambertMaterial({map: woodTexture})); // back

  buttonMaterials = new T.MeshFaceMaterial(buttonMaterialsArray);
  var playButton = new T.Mesh(
    new T.CubeGeometry(20,10,5),
    buttonMaterials
  );
  playButton.position.z = 5;
  playDevice.add(playButton);
  playDevice.lookAt(new T.Vector3(0,5,10));
  scene.add(playDevice);



  var file = 'music.mp3';
  var sound = new window.Howl({
    urls: [file]
  });

  var isPlaying = false;
  var scaleSpeaker;
  var triggerPlayToggle = function (){
    if (!isPlaying) {
      playButton.material.materials[4].color.setHex(0x00ff00);
      sound.play();
      isPlaying = true;
      scaleSpeaker = setInterval(function () {
        speaker.scale.set(1.1, 1.1, 1.1);
        speaker.position.y = 12;
        setTimeout(function () {
          speaker.scale.set(1, 1, 1);
          speaker.position.y = 10;
        }, 100);
      }, 200);
    } else {
      clearInterval(scaleSpeaker);
      playButton.material.materials[4].color.setHex(0xff0000);
      sound.stop();
      isPlaying = false;
    }
  };

  playButton.ongazelong = function () {
    triggerPlayToggle();
  };
  reticle.add_collider(playButton);

  soundIndicator = core.build('SphereGeometry', [1, 32, 32], 'MeshPhongMaterial', [{color:0xff0000}]);
  var updateSoundPosition = function () {

    var p = new T.Vector3();
    p.setFromMatrixPosition(camera.matrixWorld);
    var px = (p.x / 5);
    var pz = -(p.z / 5);
    soundIndicator.position.set(px, 5, pz);
    sound.pos3d(px, 5, pz);
  };
  var render = function() {
    controls.update();

    effect.render(scene, camera);
    requestAnimationFrame(render);
    reticle.reticle_loop();
    updateSoundPosition();
  };
  render();
  window.addEventListener('resize', function() {
    core.resizeRenderer(renderer, scene, camera, effect);
  }, false);

}(window, document));
