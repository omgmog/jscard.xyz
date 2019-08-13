(function(window, document) {
  'use strict';
  var core = window.core;
  var T = window.THREE;

  var renderer, scene, camera, effect, controls;

  var ground, ambientLight;
  var cancelHover = [];
  var levelPassed = false;

  scene = new T.Scene();
  camera = core.setCameraOptions();
  var reticle = window.vreticle.Reticle(camera);
  if (core.isPocketDevice()) {
    camera.position.set(0, 20, 20);
  } else {
    camera.position.set(0, 60, 50);
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



  // First define each level
  var icons = [
    'dorito', 'cake', 'cheese', 'donut',
    'gameover-1',
    'gameover-2',
    'gameover-3',
    'gameover-4',
    'gameover-5',
    'gameover-6',
    'gameover-7',
    'gameover-8',
    'gameover-9',
  ];

  var levels = [
    {
      target: 'dorito',
      rows: [
        [0,1,3],
        [3,2,1],
        [1,3,2],
      ]
    },
    {
      target: 'cake',
      rows: [
        [0,3,2],
        [3,1,0],
        [2,0,3],
      ]
    },
    {
      target: 'cheese',
      rows: [
        [0,1,3],
        [3,0,1],
        [0,1,2],
      ]
    },
    {
      target: 'donut',
      rows: [
        [2,0,1],
        [1,3,0],
        [0,1,2],
      ]
    },
    {
      target: 'gameover',
      rows: [
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12]
      ]
    }
  ];


  var levelObjects = [];

  var iconWidth = 12;
  var iconHeight = 9;
  var space = 6;
  var boardWidth = (iconWidth * 3) + (space * 4);

  levels.forEach(function (level) {
    // Build an object
    var levelObject = new T.Object3D();
    levelObject.position.y = 20;
    levelObject.position.z = -10;
    levelObject.position.x = -(((5 * iconWidth) + (2 * space)) / 2);

    // For each level
    var target = level.target;
    var rows = level.rows;

      // In that object, build a level board
      var levelBoard = new T.Object3D();
      levelBoard.name = target;
      levelBoard.lookAt(new T.Vector3(2,0,4));

        // In that level board, build a row
        rows.forEach(function (row, r) {
          var rowObject = new T.Object3D();

          row.forEach(function (icon, i) {
            var actualIcon = icons[icon];
            var iconTexture = T.ImageUtils.loadTexture('icons/' + actualIcon + '.png');
            iconTexture.wrapS = iconTexture.wrapT = T.ClampToEdgeWrapping;
            iconTexture.repeat.set(1,1);
            iconTexture.minFilter = T.LinearFilter;
            var iconObject = core.build(
              'PlaneBufferGeometry',
              [iconWidth,iconHeight,1,1],
              'MeshLambertMaterial',
              [{
                map: iconTexture,
                color: 0xcccccc
              }]
            );
            iconObject.name = actualIcon;
            iconObject.position.x = (i * iconWidth) + (space * (i - 1));
            iconObject.position.y = (-r * iconHeight) + (space * -(r - 1));

            var button = core.build(
              'PlaneBufferGeometry',
              [iconWidth, iconHeight, 1, 1],
              'MeshLambertMaterial',
              [{
                color: 0xff0000
              }]
            );
            button.material.visible = false;
            button.position.set(0, 0, 1);
            iconObject.add(button);
            rowObject.add(iconObject);


            iconObject.ongazeover = function () {
              rowObject.children.forEach(function (icon) {
                icon.material.color.setHex(0xcccccc);
                icon.scale.set(1,1,1);
              });
              if (cancelHover[i+1]) {
                clearTimeout(cancelHover[i+1]);
              }
              iconObject.material.color.setHex(0xffffff);
              iconObject.scale.set(1.2, 1.2, 1.2);
            };
            iconObject.ongazeout = function () {
              if (cancelHover[i+1]) {
                clearTimeout(cancelHover[i+1]);
              }
              cancelHover[i+1] = setTimeout(function () {
                iconObject.children[0].visible = false;
                iconObject.material.color.setHex(0xcccccc);
                iconObject.scale.set(1, 1, 1);
              }, 250);
            };
            iconObject.ongazelong = function () {
              setTimeout(function () {
                var target = levels[currentLevel].target;
                var current = iconObject.name;
                var color, image;
                var defaultImage = 'icons/instructions.png';
                var defaultColor = 0xffffff;

                var statusMaterial = levelObjects[currentLevel].children[1].children[1].material;
                statusMaterial.visible = false;

                if (current === target) {
                  image = 'icons/correct.png';
                  color = 0x00ff00;
                  levelPassed = true;
                  core.playSound('correct.mp3');
                } else {
                  image = 'icons/wrong.png';
                  color = 0xff0000;
                  core.playSound('wrong.mp3');
                }

                var texture = new T.ImageUtils.loadTexture(image);
                texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
                texture.repeat.set(1,1);
                texture.minFilter = T.LinearFilter;
                statusMaterial.map = texture;
                statusMaterial.color.setHex(color);
                statusMaterial.visible = true;

                setTimeout(function () {
                  texture = new T.ImageUtils.loadTexture(defaultImage);
                  texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
                  texture.repeat.set(1,1);
                  texture.minFilter = T.LinearFilter;
                  statusMaterial.map = texture;
                  statusMaterial.color.setHex(defaultColor);
                }, 1000);
              }, 1000);
            };
            reticle.add_collider(iconObject);
          });

        // Add the row to the level board
          levelBoard.add(rowObject);
        });

      // Add the level board to the object
      levelObject.add(levelBoard);

      // In that object, build a target board
      var targetBoard = new T.Object3D();
      targetBoard.position.z = -20;
      targetBoard.position.x = boardWidth;

        // In that target board build a target icon
        var targetTexture = T.ImageUtils.loadTexture('icons/' + target + '.png');
        targetTexture.wrapS = targetTexture.wrapT = T.ClampToEdgeWrapping;
        targetTexture.repeat.set(1,1);
        targetTexture.minFilter = T.LinearFilter;
        var targetWidth = (iconWidth * 2) + space;
        var targetHeight = (iconHeight * 2) + space;
        var targetIcon = core.build(
          'PlaneBufferGeometry',
          [targetWidth, targetHeight, 1, 1],
          'MeshLambertMaterial',
          [{
            map: targetTexture
          }]
        );
        targetIcon.name = target;
        targetIcon.position.y = -space;

        // Add the icon to target board
        targetBoard.add(targetIcon);

        // In that target board build a status
        var statusTexture = T.ImageUtils.loadTexture('icons/instructions.png');
        statusTexture.wrapS = statusTexture.wrapT = T.ClampToEdgeWrapping;
        statusTexture.repeat.set(1,1);
        statusTexture.minFilter = T.LinearFilter;
        var statusWidth = (iconWidth * 2) + space;
        var statusHeight = (iconHeight);
        var statusObject = core.build(
          'PlaneBufferGeometry',
          [statusWidth, statusHeight, 1, 1],
          'MeshLambertMaterial',
          [{
            map: statusTexture
          }]
        );
        statusObject.position.y = -targetHeight;

        // Add the status to target board
        targetBoard.add(statusObject);

      // Add the target board to the object
      levelObject.add(targetBoard);

    // Add the level object to the levelobjects list
    levelObjects.push(levelObject);
  });


  var backDevice = core.addBackDevice([-60, 0, 30]);
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

  var currentLevel = 0;
  var currentLevelObject = levelObjects[currentLevel];
  scene.add(currentLevelObject);
  setInterval(function () {
    if (levelPassed && currentLevel < (levelObjects.length - 1)) {
      levelPassed = false;
      scene.remove(currentLevelObject);
      currentLevel++;
      currentLevelObject = levelObjects[currentLevel];
      scene.add(currentLevelObject);
      render();
    }
  }, 100);


  var render = function() {
    controls.update();

    reticle.reticle_loop();
    effect.render(scene, camera);
    requestAnimationFrame(render);

    // Make targetBoard look at camera
    var targetBoard = levelObjects[currentLevel].children[1];
    targetBoard.lookAt(
      new T.Vector3(camera.position.x, 0, camera.position.z)
    );
    var levelBoard = levelObjects[currentLevel].children[0];
    levelBoard.lookAt(
      new T.Vector3(camera.position.x + 10, 0, camera.position.z)
    );

  };
  render();

  window.addEventListener('resize', function() {
    core.resizeRenderer(renderer, scene, camera, effect);
  }, false);

}(window, document));
