/*global paladin */
(function() {

	var Game = function( options ) {

		var engine = options.engine;
		var CubicVR = engine.graphics.CubicVR;

    var CONVEX_HULL = CubicVR.enums.collision.shape.CONVEX_HULL;
		var SPAWN_OBJS = 40;

    var FollowCamera = function( options ) {
        var canvas = CubicVR.getCanvas(),
            camera = new CubicVR.Camera( canvas.width, canvas.height, 80 );
        
        this.camera = camera;
        options.scene.graphics.camera = camera;

        var offset = [ 0, -3, 5 ],
            target = options.target;

        camera.targeted = true;

        var lagPosition = [0, 100, -100];
        engine.tasker.add({
          callback: function( task ) {
            //lagPosition[ 0 ] -= ( lagPosition[ 0 ] - ( target.spatial.position[ 0 ] - offset[ 0 ] ) ) * .2;
            //lagPosition[ 1 ] -= ( lagPosition[ 1 ] - ( target.spatial.position[ 1 ] - offset[ 1 ] ) ) * .2;
            //lagPosition[ 2 ] -= ( lagPosition[ 2 ] - ( target.spatial.position[ 2 ] - offset[ 2 ] ) ) * .2;
            //camera.position = lagPosition;
            camera.targeted = true;
            camera.target = target.spatial.position;
            return task.CONT;
          }
        });
        camera.target = target.spatial.position;
        camera.position = [10, 10, 10];
    }; //FollowCamera

    var asteroidModels = CubicVR.loadCollada("../assets/asteroids/asteroids1.dae","../assets/asteroids");
    var asteroidMeshes = [
      asteroidModels.getSceneObject("asteroid1").getMesh().clean(),
      asteroidModels.getSceneObject("asteroid2").getMesh().clean(),
      asteroidModels.getSceneObject("asteroid3").getMesh().clean(),
      asteroidModels.getSceneObject("asteroid4").getMesh().clean()
    ];
    var asteroidHulls = [
      asteroidModels.getSceneObject("asteroid1hull").getMesh(),
      asteroidModels.getSceneObject("asteroid2hull").getMesh(),
      asteroidModels.getSceneObject("asteroid3hull").getMesh(),
      asteroidModels.getSceneObject("asteroid4hull").getMesh()
    ];
    var asteroidCollisions = [
      new CubicVR.CollisionMap({ type: CONVEX_HULL, mesh: asteroidHulls[ 0 ], restitution: 0 }),
      new CubicVR.CollisionMap({ type: CONVEX_HULL, mesh: asteroidHulls[ 1 ], restitution: 0 }),
      new CubicVR.CollisionMap({ type: CONVEX_HULL, mesh: asteroidHulls[ 2 ], restitution: 0 }),
      new CubicVR.CollisionMap({ type: CONVEX_HULL, mesh: asteroidHulls[ 3 ], restitution: 0 })
    ];
   
		var envTex =  new CubicVR.Texture("../assets/fract_reflections.jpg");

    var Asteroid = function( options ) {
        var entity = this.entity = new engine.Entity();

        var rand = Math.floor( Math.random() * asteroidMeshes.length );

        var asteroidMesh = asteroidMeshes[ rand ];
        var model = new engine.component.Model({
            mesh: asteroidMesh
        });

        entity.addComponent( model );

        this.spatial = entity.spatial;
        this.setParent = entity.setParent;

				var rigidObj = this.physics = new CubicVR.RigidBody({
          sceneObject: entity.spatial.sceneObjects.graphics,
          properties: {
            type: CubicVR.enums.physics.body.STATIC,
            mass: 200,
            collision: asteroidCollisions[ rand ]                                                
					},
					impulse: [(Math.random()-0.5)*1.0,
                    (Math.random()-0.5)*1.0,
                    (Math.random()-0.5)*1.0]
				});

        Object.defineProperty( this, "position", {
          get: function() {
            return entity.spatial.sceneObjects.graphics.position;
          },
          set: function( val ) {
            entity.spatial.sceneObjects.graphics.position[ 0 ] = val[ 0 ];
            entity.spatial.sceneObjects.graphics.position[ 1 ] = val[ 1 ];
            entity.spatial.sceneObjects.graphics.position[ 2 ] = val[ 2 ];
          }
        });

        Object.defineProperty( this, "rotation", {
          get: function() {
            return entity.spatial.sceneObjects.graphics.rotation;
          },
          set: function( val ) {
            entity.spatial.sceneObjects.graphics.rotation[ 0 ] = val[ 0 ];
            entity.spatial.sceneObjects.graphics.rotation[ 1 ] = val[ 1 ];
            entity.spatial.sceneObjects.graphics.rotation[ 2 ] = val[ 2 ];
          }
        });

    }; //Asteroid

    var astronautCollada = CubicVR.loadCollada("../assets/spacesuit-scene.dae", "../assets"),
        astronautMesh = astronautCollada.getSceneObject( "astronaut" ).getMesh().clean();

    var Astronaut = function( options ) {
        var entity = this.entity = new engine.Entity();
        var model = this.model = new engine.component.Model({
            mesh: astronautMesh
        });

        entity.addComponent( model );
        this.spatial = entity.spatial;
        this.setParent = entity.setParent;
    };

    var Player = function( optoins ) {
        
        var astronaut = new Astronaut(),
            entity = this.entity = astronaut.entity;
 
        var sphereMesh = CubicVR.primitives.sphere({ radius: 1, lat: 24, lon: 24 }),
            cylinderMesh = CubicVR.primitives.cylinder({ radius: 1, height: 2, lon: 24 });

        var capsuleMesh = new CubicVR.Mesh();
        capsuleMesh.booleanAdd(cylinderMesh);
        capsuleMesh.booleanAdd(sphereMesh,(new CubicVR.Transform()).translate([0,1,0]));
        capsuleMesh.booleanAdd(sphereMesh,(new CubicVR.Transform()).translate([0,-1,0]));
        capsuleMesh.prepare();

        var capsuleCollision = new CubicVR.CollisionMap({
          type: CubicVR.enums.collision.shape.CAPSULE,
          radius: 1,
          height: 2,
          restitution: 0
        });

        var rigidObj = this.physics = new CubicVR.RigidBody( entity.spatial.sceneObjects.graphics, {
          type: CubicVR.enums.physics.body.DYNAMIC,
          mass: 0.1,
          collision: capsuleCollision 
        });

        this.physics.activate( true );

        Object.defineProperty( this, "position", {
          get: function() {
            return entity.spatial.position
          },
          set: function( val ) {
            entity.spatial.position[ 0 ] = val[ 0 ];
            entity.spatial.position[ 1 ] = val[ 1 ];
            entity.spatial.position[ 2 ] = val[ 2 ];
          }
        });

        Object.defineProperty( this, "tMatrix", {
          get: function() {
            return entity.spatial.sceneObjects.graphics.tMatrix;
          }
        });

        Object.defineProperty( this, "active", {
          get: function() {
            return rigidObj.isActive();
          },
          set: function( val ) {
            rigidObj.activate( val );
          }
        });
    };

    var Layout = function( options ) {
        var canvas = options.canvas,
            physics = options.physics,
            camera = options.camera,
            scene = options.scene,
            player = options.player;

        var layout = new CubicVR.Layout({
          width:canvas.width,
          height:canvas.height
        });

        var target1 = new CubicVR.View({
          width:50,
          height:50,
          blend:true,
          tint:[1.0,0.4,0],
          texture:new CubicVR.Texture('../assets/target.png')
        });

        var target2 = new CubicVR.View({
          width:50,
          height:50,
          blend:true,
          tint:[0,0.4,1],
          texture:new CubicVR.Texture('../assets/target.png')
        });

        layout.addSubview(target1);
        layout.addSubview(target2);

        target1.x = canvas.width/2-50;
        target1.y = canvas.height/2-50;

		    CubicVR.addResizeable(layout);

        this.render = function() {
          layout.render();
        };

        var point1 = null, point2 = null;

        var pickDist = 0;
        var lastResult = false;
        var downPos;

        // initialize a mouse view controller
        var mvc = this.mvc = new CubicVR.MouseViewController(canvas, camera),
		        kbd = CubicVR.enums.keyboard;

        mvc.setEvents({
          mouseMove: function (ctx, mpos, mdelta, keyState) {
            if (!ctx.mdown) return;
            ctx.orbitView(mdelta);
          },
          mouseWheel: function (ctx, mpos, wdelta, keyState) {
    				ctx.zoomView(wdelta);
          },
          mouseDown: function (ctx, mpos, keyState) {
            downPos = mpos;    
          },
          mouseUp: function (ctx,mpos,keyState) {
            var dx = mpos[0]-downPos[0], dy = mpos[1]-downPos[1];

            if (Math.sqrt(dx*dx+dy*dy)<4) {

              var rayTo = camera.unProject(mpos[0],mpos[1]);

              var rayFrom = player.position;

              rayFrom = CubicVR.vec3.add(rayFrom,CubicVR.vec3.multiply(CubicVR.vec3.normalize(CubicVR.vec3.subtract(rayTo,rayFrom)),1.5));

              var result = physics.getRayHit(rayFrom,rayTo,true);
              console.log( result, rayFrom, rayTo );

              lastResult = !!result;

              if (point1) {
                point1 = null;
                point2 = null;
              }                      

              if (result && !point1) {
                point1 = result;
              }
            } 
          },
          keyDown: function(ctx,mpos,keyCode,keyState) {
            if (keyCode == kbd.KEY_R) {
              if (point1) {
                point1 = null;
                point2 = null;
              }
              physics.reset(); 
              return false;
            }
          },
          keyPress: function(ctx,mpos,keyCode,keyState) {

          },
          keyUp: null
        });

        Object.defineProperty( this, "point1", {
          get: function() {
            return point1;
          },
          set: function( val ) {
            point1 = val;
          }
        });
        Object.defineProperty( this, "point2", {
          get: function() {
            return point2;
          },
          set: function( val ) {
            point2 = val;
          }
        });

        this.target1 = target1;
        this.target2 = target2;
    }; //Layout

    var GameScene = function( options ) {
        var scene = this.scene = new engine.Scene(),
            graphics = this.graphics = scene.graphics,
            physics = this.physics = new CubicVR.ScenePhysics(),
            player = this.player = new Player(),
            camera = new FollowCamera({ target: player.entity, scene: scene }),
            layout = new Layout({
              physics: physics,
              camera: camera.camera,
              scene: graphics,
              canvas: CubicVR.getCanvas(),
              player: player
            });

        CubicVR.setGlobalAmbient([0.3,0.3,0.4]);
        CubicVR.addResizeable( scene.graphics );

        scene.graphics.setSkyBox(new engine.graphics.CubicVR.SkyBox({
          texture: "../assets/space_skybox.jpg"
        }));

        graphics.bindLight(new CubicVR.Light({
          type: CubicVR.enums.light.type.DIRECTIONAL,
          specular: [1, 1, 1],
          direction: [0.5, -1, 0.5]
        }));

        graphics.bindLight(new CubicVR.Light({
          type:CubicVR.enums.light.type.AREA,
          intensity:0.9,
          mapRes:2048,  // 4096 ? 8192 ? ;)
          areaCeiling:40,
          areaFloor:-40,
          areaAxis: [-2,-2], // specified in degrees east/west north/south
          distance: 60
        }));

        CubicVR.setSoftShadows(true);

        physics.setGravity([0,0,0]);

        var graphicsCamera = camera.camera;

        function acquireTarget(point,target) {
          var sceneObj = point.rigidBody.getSceneObject();
          var proj = point.localPosition;
          var projT = CubicVR.mat4.vec3_multiply(proj,sceneObj.tMatrix);
          var targetLoc = graphicsCamera.project(projT[0],projT[1],projT[2]);
          target.x = targetLoc[0]-target.width/2;
          target.y = targetLoc[1]-target.height/2;                                              
        } //acquireTarget

        var renderObjects = graphics.render,
		        kbd = CubicVR.enums.keyboard,
            vec3 = CubicVR.vec3,
            mat4 = CubicVR.mat4;

        var time = Date.now();
        graphics.render = function() {
            var point1 = layout.point1,
                point2 = layout.point2;

            if ( !player.active ) { 
                player.active = true; 
            }

            var newTime = Date.now();
            var dt = ( newTime - time )/1000000;
            time = newTime;
            
            var angV = player.physics.getAngularVelocity();
            angV = vec3.subtract(angV,vec3.multiply(angV, dt*5));
            player.physics.setAngularVelocity(angV);

            if (layout.mvc.isKeyPressed(kbd.KEY_W)) {
                player.physics.applyImpulse(vec3.multiply(vec3.normalize(graphicsCamera.unProject(graphicsCamera.width/2,graphicsCamera.height/2)),0.001));
            }
            if (layout.mvc.isKeyPressed(kbd.KEY_S)) {
                player.physics.applyImpulse(vec3.multiply(vec3.normalize(graphicsCamera.unProject(graphicsCamera.width/2,graphicsCamera.height/2)),-0.001));
            }

            if (point1) {
                var tetherVec = vec3.subtract(mat4.vec3_multiply(point1.localPosition,point1.rigidBody.getSceneObject().tMatrix),player.position);
                var tetherDist = vec3.length(tetherVec);
                var tetherDir = vec3.normalize(tetherVec);
                
                var tetherImpulse = vec3.multiply(tetherDir,0.03);
                player.physics.applyImpulse(tetherImpulse);

                if (tetherDist < 6) {
                    var linV = player.physics.getLinearVelocity();
                    linV = vec3.subtract(linV,vec3.multiply(linV, dt*10.0));
                    player.physics.setLinearVelocity(linV);
                                                
                }
            }

            physics.stepSimulation( dt );
          
            if (point1) {
                acquireTarget(point1, layout.target1);
            } else {
                layout.target1.x = -layout.target1.width;
                layout.target1.y = -layout.target1.height;
            }
           
            if (point2) {
                acquireTarget(point2, layout.target2);
            } else {
                layout.target2.x = -layout.target2.width;
                layout.target2.y = -layout.target2.height;
            }

          renderObjects.call( graphics );
          graphics.updateShadows();
          layout.render();
        };

        var asteroids = this.asteroids = [];
        this.addAsteroid = function( position ) {
          var asteroid = new Asteroid();
          asteroid.position[0] = position[0];
          asteroid.position[1] = position[1];
          asteroid.position[2] = position[2];
          asteroid.setParent( scene );
          asteroids.push( asteroid );
          physics.bindRigidBody( asteroid.physics );
        }; //addAsteroid

        player.entity.setParent( scene );
        physics.bindRigidBody( player.physics );
    }; //GameScene

    var gameScene = new GameScene();
    for ( var i=0; i<SPAWN_OBJS; ++i ) {
      gameScene.addAsteroid([
        -350 + Math.random() * 700,
        -100 + Math.random() * 200,
        -350 + Math.random() * 700
      ]);
    }
    
		engine.sound.Track.load({
			url: "../assets/music/perfect-blind-ethernion-ii.ogg",
			callback: function( track ) {
				engine.sound.music.add( 'bg-music', track );
				engine.sound.music.play( 'bg-music' );
			}
		});

		// Run the game.
		this.run = function() {
			engine.run();
		};
		
	}; //Game

	document.addEventListener( 'DOMContentLoaded', function( event ) {
		paladin.create( { debug: true },
				function( engineInstance ) {
			var game = new Game( { engine: engineInstance } );
			game.run();
		}
		);
	}, false );

})();
