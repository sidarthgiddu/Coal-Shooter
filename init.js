var context;
var queue;
var WIDTH = 1024;
var HEIGHT = 768;
var mouseXPosition;
var mouseYPosition;
var batImage;
var stage;
var animation;
var deathAnimation;
var spriteSheet;
var enemyXPos=100;
var enemyYPos=100;
var enemyXSpeed = 1.5;
var enemyYSpeed = 1.75;
var score = 0;
var scoreText;
var levelUpText;
var gameTimer;
var gameTime = 0;
var timerText;
var numCoalsDestroyed = 0;

var questions_left = questions;
var questionSubmit;

function askQuestion(callback) {
	var index = Math.floor(Math.random() * questions_left.length);
	
	var curr = questions_left[index];
	
	var q = questions_left;
	questions_left = [];
	for (var i = 0; i < q.length; i++)
		if (i !== index)
			questions_left.push(q[i]);
	
	createjs.Ticker.setPaused(true);
	
	document.getElementById("form").style.visibility = "visible";
	document.getElementById("question").innerHTML = curr.question;
	
	document.getElementById("q-0").innerHTML = curr.answers[0];
	document.getElementById("q-1").innerHTML = curr.answers[1];
	document.getElementById("q-2").innerHTML = curr.answers[2];
	document.getElementById("q-3").innerHTML = curr.answers[3];
	
	questionSubmit = function(ind) {
		document.getElementById("answers").style.visibility = "hidden";
		var isCorrect = ind === curr.correct;
		
		document.getElementById("question").innerHTML = (isCorrect ? "Correct!" : "Wrong!");
		
		setTimeout(function() {
			document.getElementById("answers").style.visibility = "visible";
			document.getElementById("form").style.visibility = "hidden";
			
			if (isCorrect){
				createjs.Ticker.setPaused(false);
				callback();
			}else { //Do Death
				cleanup();
			}
			
		}, 1000);
		
		questionSubmit = undefined;
	}
	setTimeout(function(){questionSubmit(-1)}, 20000);
	
}

function sign(n){
	return  (n === 0) ? 0 : ((n > 0) ? 1 : -1);
} 

window.onload = function()
{
    /*
     *      Set up the Canvas with Size and height
     *
     */
    var canvas = document.getElementById('myCanvas'); //gets canvas
    context = canvas.getContext('2d'); //working in a 2d context, the getcontext method returns methods and properties needed to draw on the canvas
    context.canvas.width = WIDTH; //sets the canvas width to our predetermined width
    context.canvas.height = HEIGHT; //sets the canvas height to our predetermined height
    stage = new createjs.Stage("myCanvas"); //creates a canvas

    /*
     *      Set up the Asset Queue and load sounds
     *
     */
    queue = new createjs.LoadQueue(false); //the queues are part of a local site, so they don't need to be loaded
    queue.installPlugin(createjs.Sound); //install sound plugin on the queue
    queue.on("complete", queueLoaded, this); // runs the defined queue loaded function when the queue is complete
    createjs.Sound.alternateExtensions = ["ogg"]; //if the browser cannot play the mp3 files, it will play the alternate ogg file

    /*
     *      Create a load manifest for all assets
     *
     */
    queue.loadManifest([
        {
        	id: 'backgroundImage', 
        	src: 'assets/mars_grayscale_background.jpg'},
        {
        	id: 'crossHair', 
        	src: 'assets/crosshair.png'},
        {
        	id: 'shot', 
        	src: 'assets/shot.mp3'},
        {
        	id: 'background', 
        	src: 'assets/countryside.mp3'},
        {
        	id: 'gameOverSound', 
        	src: 'assets/gameOver.mp3'},
        {
        	id: 'tick', 
        	src: 'assets/tick.mp3'},
        {
        	id: 'deathSound', 
        	src: 'assets/die.mp3'},
        {
        	id: 'batSpritesheet', 
        	src: 'assets/batSpritesheet.png'},
        {
        	id: 'batDeath', src: 
        	'assets/batDeath.png'},
    ]);
    queue.load();

    /*
     *      Create a timer that updates once per second
     *
     */
    gameTimer = setInterval(updateTime, 1000); //initializes gameTimer each second, using update time function, to how much time has passed in the game

}

function queueLoaded(event)
{
    // Add background image
    var backgroundImage = new createjs.Bitmap(queue.getResult("backgroundImage")) //creates the background image
    stage.addChild(backgroundImage); //displays the background image
    
    var font = "48px Helvetica";
    
    //Add Score
    scoreText = new createjs.Text("Score: " + score.toString(), font, "#FFF"); //displays the text in string format
    scoreText.x = 10; //sets position of the score text: 10 on the x-axis
    scoreText.y = 10; //sets position of the score text: 10 on the y-axis
    stage.addChild(scoreText);

    //Ad Timer
    timerText = new createjs.Text("Time: " + gameTime.toString(), font, "#FFF"); //displays the time in string format
    timerText.x = 800; //sets position of the timer text: 800 on the x-axis
    timerText.y = 10; //sets position of the timer text: 10 on the y-axis
    stage.addChild(timerText);
    
    levelUpText = new createjs.Text("", font, "#FFF");
    levelUpText.x = 400;
    levelUpText.y = 200;
    stage.addChild(levelUpText);
    
    // Play background sound
    createjs.Sound.play("background", {loop: -1}); //plays and loops the background sound indefinitely

    // Create bat spritesheet
    spriteSheet = new createjs.SpriteSheet({
        "images": [queue.getResult('batSpritesheet')], //queue loads the bat spritesheet
        "frames": {"width": 198, "height": 117}, //gives the width and height of each sprite in the sprite sheet
        "animations": { "flap": [0,4] } //animations will be called "flap", go from spirte 0 to sprite 4
    });

    // Create bat death spritesheet
    batDeathSpriteSheet = new createjs.SpriteSheet({
    	"images": [queue.getResult('batDeath')], //queue loads bat death spritesheet
    	"frames": {"width": 198, "height" : 148}, //gives the width and height of each sprite in the sprite sheet
    	"animations": {"die": [0,7, false,1 ] } //animations will be called "die", false: don't want it to repeat it, and we only want to play it once
    });

    // Create bat sprite
    createEnemy(); //calls the createEnemy function defined below

    // Create crosshair
    crossHair = new createjs.Bitmap(queue.getResult("crossHair")); //creates bitmap of crosshair
    stage.addChild(crossHair); //adds crosshair

    // Add ticker
    createjs.Ticker.setFPS(30);
    createjs.Ticker.addEventListener('tick', stage);
    createjs.Ticker.addEventListener('tick', tickEvent);

    // Set up events AFTER the game is loaded
    window.onmousemove = handleMouseMove;
    window.onmousedown = handleMouseDown;
}

function createEnemy()
{
    animation = new createjs.Sprite(spriteSheet, "flap"); //creates the bat sprite object out of the sprite sheet
    animation.regX = 99; //set registration point x
    animation.regY = 58; //set registration point y
    animation.x = enemyXPos; //sets position based on this global variable
    animation.y = enemyYPos; //sets position based on this global variable
    animation.gotoAndPlay("flap"); //plays the flap animation
    animation.canBeShot = true;
    stage.addChildAt(animation,1); //add the animation behind the crosshair (which is the significance of 1)
}

function batDeath()
{
	deathAnimation = new createjs.Sprite(batDeathSpriteSheet, "die");
  deathAnimation.regX = 99;
  deathAnimation.regY = 58;
  deathAnimation.x = enemyXPos;
  deathAnimation.y = enemyYPos;
  deathAnimation.gotoAndPlay("die");
  stage.addChild(deathAnimation);
}

function tickEvent()
{
	//Make sure enemy bat is within game boundaries and move enemy Bat
	
	if(enemyXPos < WIDTH && enemyXPos > 0) //makes sure that the bat's position is inside the game
	{
		enemyXPos += enemyXSpeed;
	} else 
	{
		enemyXSpeed = enemyXSpeed * (-1);
		enemyXPos += enemyXSpeed;
	}
	if(enemyYPos < HEIGHT && enemyYPos > 0)
	{
		enemyYPos += enemyYSpeed;
	} else
	{
		enemyYSpeed = enemyYSpeed * (-1);
		enemyYPos += enemyYSpeed;
	}
	

	animation.x = enemyXPos; //move the bats by adjusting the x position of the animation
	animation.y = enemyYPos; //move the bats by adjusting the y position of the animation

	
}


function handleMouseMove(event)
{
    //Offset the position by 45 pixels so mouse is in center of crosshair
    crossHair.x = event.clientX-45;
    crossHair.y = event.clientY-45;
}

function handleMouseDown(event)
{
    
    
   //Play Gunshot sound
    createjs.Sound.play("shot");

    //Increase speed of enemy slightly
    enemyXSpeed = 1.05 * enemyXSpeed;
    enemyYSpeed = 1.05 * enemyYSpeed;

    //Obtain Shot position
    var shotX = Math.round(event.clientX);
    var shotY = Math.round(event.clientY);
    var spriteX = Math.round(animation.x);
    var spriteY = Math.round(animation.y);

    // Compute the X and Y distance using absolte value
    var distX = Math.abs(shotX - spriteX);
    var distY = Math.abs(shotY - spriteY);
	
    // Anywhere in the body or head is a hit - but not the wings
    if(distX < 30 && distY < 59 && animation.canBeShot)
    {
    	
    	//Hit
    	stage.removeChild(animation);
    	batDeath();
    	animation.canBeShot = false;
    	score += 100;
    	createjs.Sound.play("deathSound");
    	numCoalsDestroyed++;
    	
        //Make it harder next time
        if(numCoalsDestroyed % 3 === 0){
	    	enemyYSpeed *= 1.25;
	    	enemyXSpeed *= 1.3;
	    	
	    	askQuestion(function() {
	    		var timeToCreate = Math.floor((Math.random()*3500)+1);
	    setTimeout(createEnemy,timeToCreate); //execute after the given time
	    		
	    	});
	    	
	    	levelUpText.text = "Level Up!";
	    	setTimeout(function(){
	    		levelUpText.text = "";
	    	}, 500);
        }else {
        	var timeToCreate = Math.floor((Math.random()*3500)+1);
	    setTimeout(createEnemy,timeToCreate); //execute after the given time
        }

    	//Create new enemy
    	

    }
    
    //Miss
    //score -= 10;
    scoreText.text = "Score: " + score.toString();

    
}

function cleanup() {
	//End Game and Clean up
	timerText.text = "GAME OVER";
	stage.removeChild(animation);
	stage.removeChild(crossHair);
	var si =createjs.Sound.play("gameOverSound");
	clearInterval(gameTimer);	
}

function updateTime()
{
	
	gameTime += 1;
	if(gameTime > 60 && 0)
	{
		cleanup();
	}
	else
	{
		timerText.text = "Time: " + gameTime
    createjs.Sound.play("tick");
	}
}
