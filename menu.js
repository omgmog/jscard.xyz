(function (window, core) {
  'use strict';

  var T = window.THREE;

  if (core.isPocketDevice()) {
    document.body.classList.add('throwable');
  }

  var tpl = function(template, data) {
  for (var part in data) {
    template = template.replace(new RegExp('{' + part + '}', 'g'), data[part]);
  }
  return template;
};

  var renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio||1);
  renderer.setSize(core.options.width, core.options.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  var effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.focalLength = 25;
  effect.setSize(core.options.width, core.options.height);
  var scene = new T.Scene();
  var camera = core.setCameraOptions();
  var reticle = window.vreticle.Reticle(camera);
  if (core.isPocketDevice()) {
    camera.position.y = 4;
  } else {
    camera.position.y = 20;
  }
  var controls = core.setControllerMethod(camera, renderer.domElement);
  var cards = [];
  var assetsPath = core.options.assetsPath;

  var rad = 15;

  var posx = function (angle) { return rad * Math.cos(angle * Math.PI / 360);};
  var posz = function (angle) { return rad * -Math.sin(angle * Math.PI / 360);};
  var data = [
    {
      title: 'Basic VR',
      image: 'image1.png',
      name: 'basic_vr',
      position: {
        x: posx(180),
        z: posz(180)
      }
    },
    {
      title: 'Look Interaction',
      image: 'image2.png',
      name: 'look_interaction',
      position: {
        x: posx(100),
        z: posz(100),
      }
    },
    {
      title: 'Using getUserMedia',
      image: 'image4.png',
      name: 'getusermedia',
      position: {
        x: posx(20),
        z: posz(20),
      }
    },
    {
      title: 'Spacial Audio',
      image: 'image5.png',
      name: 'spacial_audio',
      position: {
        x: posx(-60),
        z: posz(-60),
      }
    }
  ];
  var createPlane = function (geometryOptions, materialOptions) {
    var geometry = core.construct(T.PlaneBufferGeometry, geometryOptions);
    var material = core.construct(T.MeshLambertMaterial, materialOptions);
    return new T.Mesh(geometry, material);
  };
  var stopLookingatCard = function (card) {
      if ((card.children).length) {
        card.children[0].visible = false;
      }
      if (cardCancelHovers[card.name]) {
        clearTimeout(cardCancelHovers[card.name]);
      }
      cardCancelHovers[card.name] = setTimeout(function () {
        // We do this to stop the hover flickering
        card.scale.set(1, 1, 1);
        card.lookAt(core.center);
      }, 250);
  };
  var handleCardLook = function (card) {
    if (cardCancelHovers[card.name]) {
      clearTimeout(cardCancelHovers[card.name]);
    }
    // Greedily reset other cards
    cards.forEach(function (card) {
        card.scale.set(1, 1, 1);
        card.lookAt(core.center);
    });

    // Make this card prominent
    var scale = 1.4;
    card.scale.set(scale, scale, 1);
    card.lookAt(new T.Vector3(0,1,0));
  };

  var _loader;

  var showLoadingIndicator = function (card) {
    var loader;
    // do some gif magic here
    if (!(card.children).length) {
      var loaderTexture = new T.ImageUtils.loadTexture('assets/launchButton.png');
      var loaderMaterial = new T.MeshBasicMaterial({
        map: loaderTexture,
        side:T.DoubleSide,
        color: 0x00ff00
      });
      var loaderGeometry = new T.PlaneBufferGeometry(4, 2, 1, 1);

      loader = new T.Mesh(loaderGeometry, loaderMaterial);
      loader.position.z = 3;
      card.add(loader);
    } else {
      loader = card.children[0];
    }
    loader.visible = true;

  };

  var cardCancelHovers = [];
  var createDemoCards = function () {
    data.forEach(function (item) {
      var texture;
      if (item.image) {
        texture = new T.ImageUtils.loadTexture(assetsPath + item.image);
        texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
        texture.repeat.set(1,1);
        texture.minFilter = T.LinearFilter;
      }
      var card = createPlane(
        [7, 5.25, 1, 1],
        [{
          map: texture
        }]
      );
      card.position.x = item.position.x;
      card.position.z = item.position.z;
      card.lookAt(core.center);
      card.name = item.name;

      // Extra info

      card.callback = function () {
      };
      card.ongazeout = function () {
        stopLookingatCard(card);
      };
      card.ongazeover = function () {
        handleCardLook(card);
      };
      card.ongazelong = function () {
        showLoadingIndicator(card);

        setTimeout(function () {
          window.location = tpl('https://blog.omgmog.net/jscard.xyz/{demo}/', {
            demo: card.name
          });
        }, 1000);
      };
      reticle.add_collider(card);

      cards.push(card);
      scene.add(card);
    });
  };
  var createGround = function () {
    var ground = createPlane([200, 200, 4, 4], [{ color: 0x555555 }]);
    ground.position.set(0, -10, -1);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  };
  var createLights = function () {
    var ambientlight = new T.AmbientLight(0xffffff, 1);
    scene.add(ambientlight);

    var spotlight = new T.SpotLight(0xffffff, 0.5);
    spotlight.position.set(0, 100, 0);
    spotlight.castShadow = true;
    spotlight.shadowMapWidth = 1024;
    spotlight.shadowMapHeight = 1024;
    spotlight.shadowCameraNear = 500;
    spotlight.shadowCameraFar = 4000;
    spotlight.shadowCameraFov = core.options.fov;
    scene.add(spotlight);
  };

  var buildScene = function () {
    createGround();
    createDemoCards();
    createLights();
    scene.add(camera);
    animateRenderer();
  };


  var animateRenderer = function () {
    effect.render(scene, camera);
    controls.update();
    reticle.reticle_loop();
    requestAnimationFrame(animateRenderer);
  };

  var init = function () {
    buildScene();
    window.addEventListener('resize', function () {
      core.resizeRenderer(renderer, scene, camera, effect);
    }, false);
    document.body.appendChild(renderer.domElement);
  };

  init();
}(window, window.core));
