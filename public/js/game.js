/* game code */

game=(function(){
// setup
    var c = document.getElementsByTagName('canvas')[0],
    ctx = c.getContext('2d');
    
    var joystick	= new VirtualJoystick({
				container	: document.getElementById('container'),
				mouseSupport	: false
			});

    c.height = 480; //window.innerHeight - 20;
    c.width = 640; //window.innerWidth - 20;
    
    var url = window.location.href;
    var id = Math.round(0xffffff*Math.random()).toString(16);
    var socket = io.connect(url);
	var rad2deg = 180 / Math.PI;
	var deg2rad = Math.PI / 180;
	var shipColor = "#fff";
	var laserColor = "#0f0";
	var spaceShipData = null; 
	var asteroids = {}; //{ x : 100, y : 100, radius : 30, vx : 1, vy : 1, vr : 0 }
	var radiusMap = [0,0,-2,-2,0,0,0,0,0,5,5,4,5,5,5,0,0,0,0,0,3,3,3,0,0,0,0,0,0,5,5,5,5,5,5,5];
	var lasers = [];
	var keysPressed = {};
	var SHIP_SCALE = 4;
	var UP_KEY = 38, DOWN_KEY = 40, LEFT_KEY = 37, RIGHT_KEY = 39, SPACEBAR = 32 ;
	var otherPlayers = {};
	var deltaTime;
	var lastUpdate = new Date().getTime() * 0.001;
	var lastDraw = new Date().getTime() * 0.001;
	var isPlayerMaster = false;
	var timeElapsedSinceLastLaser = 0;
	var asteroidSpeed = 1;
  var timeBetweenLaserFirings = 0.25;
  var maxRadiusSum = 60;
  var laserRange = 300;
  var laserSize = 10;
	var score = 0;
	
	var points = [
		{ x : 0, y : -2 },
		{ x : -2, y : 2 },
		{ x : 2, y : 2 },
		{ x : 0, y : 1 }
	];
	var lines = [
		1,0,
		0,2,
		2,3,
		3,1
	];
	
	
	window.addEventListener ("keydown", function(e){
		
		keysPressed[e.keyCode] = true;
		if( spaceShipData ){ 
			spaceShipData.keys = keysPressed;
			updatePlayerPosition();
		}
		else if( e.keyCode == SPACEBAR ){
			createSpaceShip();
		}
	});

	window.addEventListener ("keyup", function(e){
		keysPressed[e.keyCode] = false;
		if( spaceShipData ) {
			spaceShipData.keys = keysPressed;
			updatePlayerPosition();
		}
		
	});
	
	
	function createSpaceShip(){
			spaceShipData = { x : Math.random() * c.width, y : Math.random() * c.height, vx : 0, vy : 0, rotation : 0, id : id, vr : 0, ar : 0, ax : 0, ay : 0, keys : {} };
			socket.emit('newPlayer', spaceShipData );	
	}
	
	function drawLine( start, end ) {
  
		ctx.moveTo(start.x,start.y);
  
  
		ctx.lineTo(end.x,end.y);

		
	}
	
	function drawAsteroids(){
		for(var i=asteroid.length-1;i>=0;i--) {
			drawAsteroid(asteroid[i]);
		}
	}
	
	function drawAsteroid( asteroid ){
		var x = asteroid.x,
			y = asteroid.y,
			defaultRadius = asteroid.radius,
			radius,
			lastPosition,
			position = {}, 
			i = 0;
			
		/* for values of alpha starting at 0 and ending at 360 */
		for (var alpha= 0; alpha <= 360; alpha += 5){ 
		
			radius = defaultRadius + defaultRadius * radiusMap[i % radiusMap.length ] * 1/30;
			
			/* calculate new position,  x=r*sin(alpha), y=r*cos(alpha); */
 			position.x = x + radius * Math.sin( alpha * deg2rad );
 			position.y = y + radius * Math.cos( alpha * deg2rad );
 		
 			
			/* if last position exists then: */
			if( lastPosition )
			{
				drawLine( lastPosition, position );
			}
			else
			{
				lastPosition = {};
			}
		
		
			/* draw a line from the last position to the new position */
		
			/* store position onto last the position */	
		
		
			lastPosition.x = position.x;
			lastPosition.y = position.y;
	
			i++;
		}
		
		
	}
	
	function drawLasers(){
		
		for(var i=lasers.length-1;i>=0;i--){
			drawLaser(lasers[i]);
		}
		
	}
	
	function drawLaser(laser) {
		var start = { x:laser.x , y:laser.y };
		var end = { x:laser.lx + laser.x , y:laser.ly + laser.y };
		drawLine( start, end );
	}

	function drawSpaceShip(spaceShipData){
		var x = spaceShipData.x,
			y = spaceShipData.y;
		
		
		ctx.save();
		ctx.translate(x,y);
		
		ctx.rotate( spaceShipData.rotation * deg2rad );
		ctx.translate(0,-0.5);
		ctx.scale(SHIP_SCALE,SHIP_SCALE);
		
		/* Draw ships lines, each line is made up of the indexes to two points in the points array */
		for( var i=lines.length-1; i>=0; i-=2 )
		{
			drawLine( points[lines[i]], points[lines[i-1]] );
		}
		
		ctx.restore();

	}


	
	function clearScreen(){
		// Store the current transformation matrix
		ctx.save();
		// Use the identity matrix while clearing the canvas
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, c.width, c.height);
		// Restore the transform
 		ctx.restore();

	}


	function masterUpdate(){
		
		/* if not the master, then don't perform this routine */
		if( ! isPlayerMaster ) return;

		var radiusSum = 0;
		for( var id in asteroids ){
			radiusSum += asteroids[id].radius;
		}
		
		while( radiusSum < maxRadiusSum ){
		
			var randomAngle = Math.random() * 360 * deg2rad;
		
			var position = { x : Math.random() * c.width, y : Math.random() * c.height}, 
			direction = { x : asteroidSpeed * Math.sin( randomAngle ) , y : asteroidSpeed * Math.cos( randomAngle ) }, 
			radius = 30;
			spawnNewAsteroid( position, direction, radius )
			radiusSum = radiusSum + radius;
		}
		
	
	
	}

	function updateAsteroids()
	{
    
		/* While number of asteroids is smaller than the target number of asteroid,
          
		create a new asteroid 
    
		*/
  
    
		/*
		for(var i=0; i < asteroids.length; i++){

			updateAsteroid( asteroids[i] );
		}
		*/
		for( var id in asteroids ) {
			updateAsteroid( asteroids[id] );
		}

		/* For each asteroid
          
		Update the position of that asteroid 
    
		*/

	}


	
	function updateAsteroid(asteroid){
	/* move the spaceship positon by the velocity */
  
		asteroid.x += asteroid.vx;
		asteroid.y += asteroid.vy;
		asteroid.rotation += asteroid.vr;
		/* if the spaceship is off the screen, move it to the other side */
		
		if(asteroid.y < 0) {
			(asteroid.y) += c.height;
		}
  
		
		if(asteroid.x < 0) {
			asteroid.x += c.width; 
 
		}
  		
		if(asteroid.x > c.width) {
			asteroid.x -= c.width;
		}

  
		
		if(asteroid.y > c.height) {
			asteroid.y -= c.height;  
		}

		
		
		
	}
	
	
	function updateLasers(){
		for(var i=0; i < lasers.length; i++){
			if( isLaserOutOfRange( lasers[i] ) ){
				lasers.splice( i, 1 );
				i--;
				continue;
			}
			updateLaser( lasers[i] );
		} 
	}
	
	function updateLaser(laser){
		laser.x += laser.vx;
		laser.y += laser.vy;

	    laser.distanceRemaining -= laser.speed;

	    if(laser.x > c.width) { laser.x -= c.width; }
	    if(laser.x < 0) { laser.x += c.width; }
	    if(laser.y > c.height) { laser.y -= c.height; }
	    if(laser.y < 0) { laser.y += c.height; }
			
	}
	
	function updateSpaceShip( spaceShipData )
{
  
		
		/* 
		if the user has pressed up then 
		calculate the horizontal component of the thrust ( Math.cos ) 
       
		calculate the vertical component of the thrust ( Math.sin )
    
		*/
  
		
		if( spaceShipData.keys[UP_KEY] ){
			spaceShipData.ax = 0.1 * Math.sin( deg2rad * spaceShipData.rotation );
			spaceShipData.ay = -0.1 * Math.cos( deg2rad * spaceShipData.rotation );
		}else
		{
			spaceShipData.ax = spaceShipData.ay = 0;
		}
		
		spaceShipData.ar =  0;

		/* if the user has pressed left, decrease the space ship rotation angle */
 
		if( spaceShipData.keys[LEFT_KEY] )
		{
			spaceShipData.ar = -0.25;
		}
		/* if the user has pressed right, increase the space ship rotation angle */
  

		else if( spaceShipData.keys[RIGHT_KEY] ){
		
			spaceShipData.ar = 0.25;
		}
				
		
		spaceShipData.vx += spaceShipData.ax;
		spaceShipData.vy += spaceShipData.ay;
		spaceShipData.vr += spaceShipData.ar;
	
		/* move the spaceship positon by the velocity */
  
		spaceShipData.x += spaceShipData.vx;
		spaceShipData.y += spaceShipData.vy;
		spaceShipData.rotation += spaceShipData.vr;
		/* if the spaceship is off the screen, move it to the other side */
		
		if(spaceShipData.y < 0) {
			(spaceShipData.y) += c.height;
		}
  
		
		if(spaceShipData.x < 0) {
			spaceShipData.x += c.width; 
		}

  
		
		if(spaceShipData.x > c.width) {
			spaceShipData.x -= c.width;
		}

  
		
		if(spaceShipData.y > c.height) {
			spaceShipData.y -= c.height;
		}

		
		spaceShipData.vr *= 0.95;
		spaceShipData.vx *= 0.99;
		spaceShipData.vy *= 0.99;
		
		var transform = spaceShipData.transform || ( spaceShipData.transform = new Transform() );
		transform.reset();	
		transform.translate(spaceShipData.x,spaceShipData.y);
		transform.rotate( spaceShipData.rotation * deg2rad );
		transform.translate(0,-0.5);
		transform.scale(SHIP_SCALE,SHIP_SCALE);
		

	}
	
	function updateShooting(){
		if (  spaceShipData.keys[SPACEBAR] ) {
			fireLaser();
		}
		
		timeElapsedSinceLastLaser += deltaTime;
		

	}


	
	function checkForCollision(){
		
		var playerBounds = geom.calculateBounds( geom.applyMatrixToPoints( points, spaceShipData.transform ) );
	
		for( var spaceShipId in otherPlayers ) {			
			var enemySpaceShip = otherPlayers[spaceShipId];
			
			var enemyBounds = geom.calculateBounds( geom.applyMatrixToPoints( points, enemySpaceShip.transform ) );
			
			if( geom.doBoundsOverlap( enemyBounds, playerBounds ) ){
				killPlayer();
				socket.emit("hit", enemySpaceShip );
				delete otherPlayers[enemySpaceShip.id];
			}
		}
		
	
	}

	function checkForPlayerAsteroidCollision(){

		var playerBounds = geom.calculateBounds( geom.applyMatrixToPoints( points, spaceShipData.transform ) );

		for( var asteroidId in asteroids ) {			
			var asteroid = asteroids[asteroidId];
			
			if( geom.doesCircleOverlapWithBounds( asteroid, asteroid.radius, playerBounds ) ){
				
				killPlayer();
				playerDestroyAsteroid(asteroidId);
				
			}
		}
	}

	function checkMyLasersHitAsteroid(){
		var laser;
		for( var i=lasers.length-1; i >= 0; i-- ){
			laser = lasers[i];
			
			if( id == laser.emitterId ){ 
				if( checkLaserHitAsteroid( laser ) ){
					lasers.splice( i, 1 );
				}
			}
		}  
	}
	
	function checkLaserHitAsteroid(laser){
		var hit = false;
		var asteroid;
		
		for( var id in asteroids ){
			asteroid = asteroids[id];
			if( geom.doesPointLieWithinCircle( laser, asteroid, asteroid.radius ) ){
				hit = true;
				//asteroids.splice(i,1);
				
				playerDestroyAsteroid(id, { x : laser.vx, y : laser.vy });

				break;
			}
		}
		
		return hit; 
	}

	function playerDestroyAsteroid(id){

		var asteroid = asteroids[id];

		destroyAsteroid( id );

		var newRadius = asteroid.radius * 0.7;
		
		if( newRadius < 5 ) {
			return;
		}

		var leftAsteroidDirection = rotateBy90( { x : asteroid.vx , y : asteroid.vy  } );
		var rightAsteroidDirection = rotateByNeg90( { x : asteroid.vx , y : asteroid.vy  } );

		var leftAsteroidPosition = { x : asteroid.x + asteroidSpeed * leftAsteroidDirection.x , y : asteroid.y + asteroidSpeed * leftAsteroidDirection.y };				
		var rightAsteroidPosition = { x : asteroid.x + asteroidSpeed * rightAsteroidDirection.x , y : asteroid.y + asteroidSpeed * rightAsteroidDirection.y };
		
		var asteroid1 = spawnNewAsteroid( leftAsteroidPosition, leftAsteroidDirection, newRadius );
		var asteroid2 = spawnNewAsteroid( rightAsteroidPosition, rightAsteroidDirection, newRadius );

		socket.emit('asteroidDestroyed', id, [asteroid1,asteroid2])
		masterUpdate();

	}
	
	
	
	function checkMyLasersForHit(){
		var laser;
		for( var i=lasers.length-1; i >= 0; i-- ){
			laser = lasers[i];
			
			if( id == laser.emitterId ){ 
				if( checkLaserForHit( laser ) ){
					lasers.splice( i, 1 );
				}
			}
		}  
	}
	
	function checkLaserForHit(laser){
			
		var hit = false;
		
		for( var spaceShipId in otherPlayers ) {
			
			var enemySpaceShip = otherPlayers[spaceShipId];
			
			var bounds = geom.calculateBounds( geom.applyMatrixToPoints( points, enemySpaceShip.transform ) );
			
			
			if( geom.isPointInsideBounds( laser, bounds ) )
			{
				hitSpaceShip(enemySpaceShip);
				hit = true;
				break;
			}
		}
	
		return hit;
	}
	
	function hitSpaceShip(enemySpaceShip){
		socket.emit("hit", enemySpaceShip );
		score += 10;
		delete otherPlayers[enemySpaceShip.id];
	}
	
	function checkInput(){
		if( VirtualJoystick.touchScreenAvailable() ){
			spaceShipData.keys[RIGHT_KEY] = joystick.right();
			spaceShipData.keys[LEFT_KEY] = joystick.left();
			spaceShipData.keys[UP_KEY] = joystick.up();
			spaceShipData.keys[DOWN_KEY] = joystick.down();
		}
	}
	
	function isPointOutOfBounds(point){
		var inVertical = (point.x < 0) || (point.x > c.width);
		var inHorizontal = (point.y < 0) || (point.y > c.height);
		
		return inVertical || inHorizontal;
	}

	function isLaserOutOfRange(laser) {
		return laser.distanceRemaining <= 0;
	}
	
	function update() {
		
		var currentTime = new Date().getTime() * 0.001;
		deltaTime = currentTime - lastUpdate;
	
		/* check joystick positions for touchscreen devices */
		checkInput();
		
		/* move the position of the asteroids */
		updateAsteroids();
		
		/* move the position of the lasers */
		updateLasers();
				
		/* update the players spaceship first */
		if( spaceShipData ) updateSpaceShip( spaceShipData );	
		
		/* update all the other spaceships */
		for( var spaceShipId in otherPlayers ) updateSpaceShip(otherPlayers[spaceShipId]);
	
		/* check to see if the player has crashed into another */
		if( spaceShipData )
		{
			checkForCollision();
			checkForPlayerAsteroidCollision();
		}


		if( spaceShipData )
		{
		
			/* fire laser if space is down */
			updateShooting();
			
			/* have we hit anyone? */
			checkMyLasersHitAsteroid();
			checkMyLasersForHit();
		}

	
		lastUpdate = currentTime;	
	}
	
	function updateScreen(){
  
 
	
		var currentTime = new Date().getTime() * 0.001;
		deltaTime = currentTime - lastDraw;

	  
		clearScreen();
		ctx.lineWidth = 1;
		ctx.beginPath();
   
		ctx.strokeStyle = laserColor;
		
		drawLasers();
		
		ctx.stroke();
  
		ctx.closePath();

		
		ctx.beginPath();
   
		ctx.strokeStyle = shipColor;
		ctx.fillStyle = shipColor;
		for( var spaceShipId in otherPlayers ) drawSpaceShip(otherPlayers[spaceShipId]);
		
		if( spaceShipData ) 
		{
			ctx.textAlign = "left";
			ctx.font = "bold 12px monospace";
			ctx.fillText("score: "+score, 10, 20 );
			drawSpaceShip(spaceShipData);
		}
		else {	
			
			ctx.textAlign = "center";
			ctx.font = "bold 12px monospace";
			ctx.fillText("PRESS SPACE TO START", c.width/2, c.height/2);
		}
		
		for( var asteroidId in asteroids ) drawAsteroid( asteroids[asteroidId] );
	
		
		ctx.stroke();
  
		ctx.closePath();

		
		window.requestAnimationFrame( updateScreen );

		lastDraw = currentTime;
	}
	
	function onUpdatePlayerPosition(data){
		
		var keyAlreadyExists =  data.id in otherPlayers ;
		
		if( ! keyAlreadyExists ) otherPlayers[data.id] = { x : data.x, y : data.y };
		
		var playerData = otherPlayers[data.id];
		playerData.id = data.id;
		playerData.vx = data.vx;
		playerData.vy = data.vy;
		playerData.vr = data.vr;
		playerData.keys = data.keys;
		if( Math.abs( data.x - playerData.x ) < 30 && Math.abs( data.y - playerData.y ) < 30 ){

			playerData.x += ( data.x - playerData.x ) * 0.5;
			playerData.y +=  ( data.y - playerData.y ) * 0.5;

		}
		else
		{
			playerData.x = data.x;
			playerData.y = data.y;
		}
		
		playerData.rotation = data.rotation;
		
		
	}

	function onAppointedMaster(){
		isPlayerMaster = true;
		masterUpdate();
		console.log("appointed master");
	}
	
	function onPlayerDisconnected(id){
		//console.log("player disconnected "+id);
	
		delete otherPlayers[id];
	}
	
	function updatePlayerPosition(){
		if( spaceShipData ) socket.emit("updatePosition",spaceShipData);
	}
	function fireLaser(){
	
		if( timeElapsedSinceLastLaser < 0.1 ){
			return;
		}
		
		timeElapsedSinceLastLaser = 0;
	
		var laser = { lx : 0, ly : 0, vx : 0, vy : 0, x : 0, y : 0 };
		
		var dx = Math.sin( deg2rad * spaceShipData.rotation ),
			dy = Math.cos( deg2rad * spaceShipData.rotation ),
			speed = 10;
		


		laser.x = spaceShipData.x + 2 * SHIP_SCALE * dx;
		laser.y = spaceShipData.y + -2 * SHIP_SCALE * dy;
		laser.vx = speed * dx + spaceShipData.vx;
		laser.vy = -speed * dy + spaceShipData.vy;
		laser.lx = speed * dx;
		laser.ly = -speed * dy;
		laser.emitterId = spaceShipData.id;
	    laser.distanceRemaining = laserRange;
	    laser.speed = speed;

		lasers.push( laser );
		
		socket.emit('newLaser', laser );
	}

	function createAsteroid( asteroid ){
		asteroids[asteroid.id] = asteroid;
	}

	function destroyAsteroid( id ){
		delete asteroids[id];
	}
	
	function onAsteroidCreated( asteroid ){
		createAsteroid( asteroid );
	}

	function onAsteroidDestroyed( id, newAsteroids ){
	
		destroyAsteroid( id );

		for( var id in newAsteroids ) createAsteroid( newAsteroids[id] );
		masterUpdate();
	}

	function onPlayerKilled(ship){
		/* If you, destroy your ship */
		if( spaceShipData && spaceShipData.id == ship.id ) {
			killPlayer();
		}
		else {
			killEnemy(ship);
		}
	}
	
	function killPlayer(){
		spaceShipData = null;
		score = 0;
	}
	
	function killEnemy(ship){
		delete otherPlayers[ship.id];
	}
	
	function onNewLaser(laser){
		lasers.push(laser);
	}
	
	function rotateBy90(v){
		var tmp;
		v = { x:v.x, y:v.y };
		tmp = v.y;
		v.y = v.x; 
		v.x = tmp;
		v.y = -v.y;
		return v;
	}
	function rotateByNeg90(v){
		var tmp;
		v = { x:v.x, y:v.y };
		tmp = v.y;
		v.y = v.x; 
		v.x = tmp;
		v.x = -v.x;
		return v;
	}
	
	function spawnNewAsteroid( position, direction, radius )
	{
		var id = ( Math.random() * 0xffffffff ).toString(16);
		asteroids[id] = { 
			id : id,
			x : position.x, 
			y : position.y, 
			radius : radius, 
			vx : direction.x, 
			vy : direction.y, 
			vr : 0 
		};
	}
		
	
	setInterval( update, 20 );

	setInterval( updatePlayerPosition, 100 );
	
	window.requestAnimationFrame( updateScreen );
	
	socket.on("updatePosition", onUpdatePlayerPosition );
	socket.on("playerDisconnected", onPlayerDisconnected );
	socket.on("appointedMaster", onAppointedMaster);
	socket.on("newLaser", onNewLaser);
	socket.on("playerKilled", onPlayerKilled );
	socket.on("asteroidDestroyed", onAsteroidDestroyed);
	socket.on("asteroidCreated", onAsteroidCreated);
	socket.on("connect", function(){
		//console.log("connected");
		
	});
});