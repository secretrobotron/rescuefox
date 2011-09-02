/*global paladin */
(function() {

	var Game = function( options ) {

		var engine = options.engine;
		var CubicVR = engine.graphics.CubicVR;

    var CONVEX_HULL = CubicVR.enums.collision.shape.CONVEX_HULL;
		var SPAWN_OBJS = 100;

    var FollowCamera = function( options ) {
        var canvas = CubicVR.getCanvas(),
            camera = new CubicVR.Camera( canvas.width, canvas.height, 80 );
        
        options.scene.graphics.camera = camera;

        var offset = [ 0, -3, 5 ],
            target = options.target;

        camera.targeted = true;

        var lagPosition = [0, 100, -100];
        engine.tasker.add({
          callback: function( task ) {
            lagPosition[ 0 ] -= ( lagPosition[ 0 ] - ( target.spatial.position[ 0 ] - offset[ 0 ] ) ) * .2;
            lagPosition[ 1 ] -= ( lagPosition[ 1 ] - ( target.spatial.position[ 1 ] - offset[ 1 ] ) ) * .2;
            lagPosition[ 2 ] -= ( lagPosition[ 2 ] - ( target.spatial.position[ 2 ] - offset[ 2 ] ) ) * .2;
            camera.position = lagPosition;
            camera.target = target.spatial.position;
            return task.CONT;
          }
        });
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

        var sceneObject = entity.graphics.object;

				var rigidObj = this.physics = new CubicVR.RigidBody({
          sceneObject: sceneObject, 
          properties: {
            type: CubicVR.enums.physics.body.DYNAMIC,
            mass: (1 + rand) * 20,
            collision: asteroidCollisions[ rand ]                                                
					},
					impulse: [(Math.random()-0.5)*100.0,
                    (Math.random()-0.5)*100.0,
                    (Math.random()-0.5)*100.0]
				});

        Object.defineProperty( this, "position", {
          get: function() {
            return entity.position;
          },
          set: function( val ) {
            entity.position[ 0 ] = val[ 0 ];
            entity.position[ 1 ] = val[ 1 ];
            entity.position[ 2 ] = val[ 2 ];
          }
        });

        Object.defineProperty( this, "rotation", {
          get: function() {
            return entity.rotation;
          },
          set: function( val ) {
            entity.rotation[ 0 ] = val[ 0 ];
            entity.rotation[ 1 ] = val[ 1 ];
            entity.rotation[ 2 ] = val[ 2 ];
          }
        });

    };

    var astronautCollada = CubicVR.loadCollada("../assets/spacesuit-scene.dae", "../assets"),
        astronautMesh = astronautCollada.getSceneObject( "astronaut" ).getMesh().clean();

    var Astronaut = function( options ) {
        var entity = this.entity = new engine.Entity();
        var model = new engine.component.Model({
            mesh: astronautMesh
        });

        entity.addComponent( model );
        this.spatial = entity.spatial;
        this.setParent = entity.setParent;
    };

    var Player = function( optoins ) {
        
        var astronaut = new Astronaut(),
            entity = this.entity = astronaut.entity,
            sceneObject = entity.graphics.object;
 
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

        var rigidObj = new CubicVR.RigidBody(sceneObj, {
          type: CubicVR.enums.physics.body.DYNAMIC,
          mass: 0.1,
          collision: capsuleCollision 
        });

        this.activate = rigidObj.activate;

        this.activate( true );

        this.physics = ridigObj;
    };

    var Layout = function( options ) {
        var canvas = CubicVR.getCanvas();
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

        this.render = layout.render;
    }; //Layout

    var GameScene = function( options ) {
        var scene = this.scene = new engine.Scene(),
            graphics = this.graphics = scene.graphics,
            layout = new Layout();

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

        var physics = this.physics = new CubicVR.ScenePhysics();
        physics.setGravity([0,0,0]);

        var renderObjects = graphics.render,
            renderLayout = layout.render;

        graphics.render = function( timer, gl ) {
          options.update && options.update( timer, gl );
          renderObject();
          renderLayout();
        };

        var asteroids = this.asteroids = [];
        this.addAsteroid = function( position ) {
          var asteroid = new Asteroid();
          asteroid.spatial.position[0] = position[0];
          asteroid.spatial.position[1] = position[1];
          asteroid.spatial.position[2] = position[2];
          asteroid.setParent( scene );
          asteroids.push( asteroid );
        }; //addAsteroid

        var player = this.player = new Player();
        player.entity.setParent( scene );
    }; //GameScene

		//----------- MOUSE EVENTS:START -------------
		var point1 = null, point2 = null;

		var pickDist = 0;
		var lastResult = false;
		var downPos;

		// initialize a mouse view controller
		var mvc = new CubicVR.MouseViewController(canvas, scene.camera);

		mvc.setEvents({
			mouseMove: function (ctx, mpos, mdelta, keyState) {

				if (!ctx.mdown) return;

				ctx.orbitView(mdelta);
				//          ctx.panView(mdelta);
			},
			mouseWheel: function (ctx, mpos, wdelta, keyState) {
//				ctx.zoomView(wdelta);
			},
			mouseDown: function (ctx, mpos, keyState) {
				downPos = mpos;    

			},
//			mouseUp: function(ctx, mpos, keyState) {

//			},
			mouseUp: function (ctx,mpos,keyState) {
				var dx = mpos[0]-downPos[0], dy = mpos[1]-downPos[1];

				if (Math.sqrt(dx*dx+dy*dy)<4) {

					var rayTo = scene.camera.unProject(mpos[0],mpos[1]);

					var rayFrom = scene.camera.getParentedPosition();

					rayFrom = CubicVR.vec3.add(rayFrom,CubicVR.vec3.multiply(CubicVR.vec3.normalize(CubicVR.vec3.subtract(rayTo,rayFrom)),1.5));

					var result = physics.getRayHit(rayFrom,rayTo,true);

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
		//----------- MOUSE EVENTS:END -------------


		function acquireTarget(point,target) {
			var sceneObj = point.rigidBody.getSceneObject();
			var proj = point.localPosition;
			var projT = CubicVR.mat4.vec3_multiply(proj,sceneObj.tMatrix);
			var targetLoc = scene.camera.project(projT[0],projT[1],projT[2]);
			target.x = targetLoc[0]-target.width/2;
			target.y = targetLoc[1]-target.height/2;                                              
		}

		var kbd = CubicVR.enums.keyboard;
		
    /*
    CubicVR.MainLoop(function(timer, gl) {
        var seconds = timer.getSeconds();

        if (!player.isActive()) { 
            player.activate(); 
        }
        
        var angV = player.getAngularVelocity();
        angV = CubicVR.vec3.subtract(angV,CubicVR.vec3.multiply(angV,timer.getLastUpdateSeconds()*5));
        player.setAngularVelocity(angV);

        if (mvc.isKeyPressed(kbd.KEY_W)) {
            player.applyImpulse(CubicVR.vec3.multiply(CubicVR.vec3.normalize(scene.camera.unProject(scene.camera.width/2,scene.camera.height/2)),0.001));
        }
        if (mvc.isKeyPressed(kbd.KEY_S)) {
            player.applyImpulse(CubicVR.vec3.multiply(CubicVR.vec3.normalize(scene.camera.unProject(scene.camera.width/2,scene.camera.height/2)),-0.001));
        }

        if (point1) {
            var tetherVec = CubicVR.vec3.subtract(CubicVR.mat4.vec3_multiply(point1.localPosition,point1.rigidBody.getSceneObject().tMatrix),player.getSceneObject().position);
            var tetherDist = CubicVR.vec3.length(tetherVec);
            var tetherDir = CubicVR.vec3.normalize(tetherVec);
            
            
            var tetherImpulse = CubicVR.vec3.multiply(tetherDir,0.03);
            player.applyImpulse(tetherImpulse);

            if (tetherDist < 6) {
                var linV = player.getLinearVelocity();
                linV = CubicVR.vec3.subtract(linV,CubicVR.vec3.multiply(linV,timer.getLastUpdateSeconds()*10.0));
                player.setLinearVelocity(linV);
                                            
            }
        }

        physics.stepSimulation(timer.getLastUpdateSeconds());
        
        scene.updateShadows();
        scene.render();
        

         if (point1) {
            acquireTarget(point1,target1);
         } else {
            target1.x = -target1.width;
            target1.y = -target1.height;
         }
         
         if (point2) {
            acquireTarget(point2,target2);
         } else {
            target2.x = -target2.width;
            target2.y = -target2.height;
         }

        layout.render();
    });
    */

    var gameScene = new GameScene({
      update: function( timer, gl ) {
        console.log('boop');
      }
    });
    for ( var i=0; i<SPAWN_OBJECTS; ++i ) {
      gameScene.addAsteroid([
        -20 + Math.random() * 50,
        -2 + Math.random() * 4,
        -20 + Math.random() * 50
      ]);
    }

    var camera = new FollowCamera({
      target: astronaut,
      scene: scene
    });
     
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
			console.log( "Starting game" );
			game.run();
		}
		);
	}, false );

})();
