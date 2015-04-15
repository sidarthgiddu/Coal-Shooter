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
var enemyXSpeed = 3.5;
var enemyYSpeed = 2.75;
var score = 0;
var scoreText;
var levelUpText;
var displayDirections;
var playGame;
var gameTimer;
var gameTime = 0;
var timerText;
var numCoalsDestroyed = 0;

var questions_left = questions; //contains an array of the questions left
var questionSubmit;

function askQuestion(callback) { //callback function
	createjs.Ticker.setPaused(true);//pauses the game
	
	if (questions_left.length === 0) {
		do_win();
		return;
	}
	
	var index = Math.floor(Math.random() * questions_left.length);//restricts the bounds of the index so as to not create a run time error
	
	var curr = questions_left[index];//gets current question
	
	var q = questions_left; //refers to questions_left
	questions_left = [];
	for (var i = 0; i < q.length; i++)
		if (i !== index)
			questions_left.push(q[i]);//adds whatever questions are left to questions left except the existing question
	
	document.getElementById("form").style.visibility = "visible"; //sets the css property of the form as visible
	document.getElementById("answers").style.display = "initial"; //sets the css property of the answers as visible
	document.getElementById("question").innerHTML = curr.question;//assigns the div id question w/ the current question
	
	document.getElementById("q-0").innerHTML = curr.answers[0]; //assigns the span id q-0 w/ the current answer
	document.getElementById("q-1").innerHTML = curr.answers[1]; //assigns the span id q-1 w/ the current answer
	document.getElementById("q-2").innerHTML = curr.answers[2]; //assigns the span id q-2 w/ the current answer
	document.getElementById("q-3").innerHTML = curr.answers[3]; //assigns the span id q-3 w/ the current answer
	
	questionSubmit = function(ind) { //ind represents the answer
		document.getElementById("answers").style.display = "none"; //hides the answers using css property
		var isCorrect = ind === curr.correct; //stores either true or false, depending on whether the user answered the question correctly
		
		document.getElementById("question").innerHTML = (isCorrect ? "<h1>Correct!</h1>" : "<h1>Wrong!</h1><br><button onclick=\"location.reload();\">Play Again?</button>"); //sets the html of the span question to display Correct! if answer is true or Wrong! if answer is false
		
		if (isCorrect)
			setTimeout(function() {
				document.getElementById("form").style.visibility = "hidden"; //hides the form
				
				if (isCorrect){
					createjs.Ticker.setPaused(false); //resumes the game
					//levelUpText.text = "Level Up!"
					callback(); //calls callback function
				}else { //Do Death
					cleanup(); //runs the cleanup function and tells the game "GAME OVER!"
				}
	    			
			}, 1000); //run for 1000 milliseconds
			
		
		questionSubmit = undefined;
		
	}
	setTimeout(function(){questionSubmit(-1)}, 20000);
	
}

function do_win() {
	document.getElementById("form").style.visibility = "visible"; //sets the css property of the form as visible
	document.getElementById("question").innerHTML = "<h1>You Saved Sarah the Sun! You Win!</h1><br><button onclick=\"location.reload();\">Play Again?</button>";
	
}

displayDirections = function(){
	document.getElementById("direction_screen").style.visibility = "visible";
	document.getElementById("startup_screen").style.visibility = "hidden";
};

playGame = function(){
	document.getElementById("direction_screen").style.visibility = "hidden";
	document.getElementById("startup_screen").style.visibility = "hidden";
	document.getElementById("myCanvas").style.opacity = "1.0";
};	


function sign(n){
	return  (n === 0) ? 0 : ((n > 0) ? 1 : -1); //if n = 0 return 0, if n > 0 return 1, else return -1
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
	pauseGame();
	

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
        	id: 'coalSpritesheet', 
        	src: 'assets/piece_of_coal.jpg'},
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
    timerText.x = 1014; //sets position of the timer text: 800 on the x-axis
    timerText.y = 10; //sets position of the timer text: 10 on the y-axis
    timerText.textAlign = "right";
    stage.addChild(timerText);
    
    levelUpText = new createjs.Text("", font, "#FFF");
    levelUpText.x = 400;
    levelUpText.y = 200;
    stage.addChild(levelUpText);
    
    // Play background sound
    createjs.Sound.play("background", {loop: -1}); //plays and loops the background sound indefinitely

    // Create bat spritesheet
    spriteSheet = new createjs.SpriteSheet({
        "images": [queue.getResult('coalSpritesheet')], //queue loads the bat spritesheet
        "frames": {"width": 213, "height": 160}, //gives the width and height of each sprite in the sprite sheet
        "animations": { "sit": 0 } //animations will be called "flap", go from spirte 0 to sprite 4
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
	
    var cnvs = document.getElementById("myCanvas");
    // Set up events AFTER the game is loaded
    cnvs.onmousemove = handleMouseMove;
    cnvs.onmousedown = handleMouseDown;
    
    var coalImage = document.getElementById('coalSpritesheet');
    coalImage.src = white2transparent(coalImage);
}

function white2transparent(img)
{
    var c = document.createElement('canvas');

    var w = img.width;
    var h = img.height;

    c.width = w;
    c.height = h;

    var ctx = c.getContext('2d');

    ctx.drawImage(img, 0, 0, w, h);
    var imageData = ctx.getImageData(0,0, w, h);
    var pixel = imageData.data;

    var r=0;
    var g=1; 
    var b=2;
    var a=3;
    for (var p = 0; p<pixel.length; p+=4)
    {
      if (
          pixel[p+r] == 255 &&
          pixel[p+g] == 255 &&
          pixel[p+b] == 255) // if white then change alpha to 0
      {pixel[p+a] = 0;}
    }

    ctx.putImageData(imageData,0,0);

    return c.toDataURL('image/jpeg');
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

function pauseGame(){
	createjs.Ticker.setPaused(true);
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
    var cnvs = document.getElementById("myCanvas");
    //Offset the position by 45 pixels so mouse is in center of crosshair
    crossHair.x = event.clientX-45 - cnvs.offsetLeft + (cnvs.width / 2);
    crossHair.y = event.clientY-45 - cnvs.offsetTop + (cnvs.height / 2);
}

function handleMouseDown(event)
{
    
    
   //Play Gunshot sound
    createjs.Sound.play("shot");

    //Increase speed of enemy slightly
    

    //Obtain Shot position
    var cnvs = document.getElementById("myCanvas");
    var shotX = Math.round(event.clientX - cnvs.offsetLeft + (cnvs.width / 2));
    var shotY = Math.round(event.clientY - cnvs.offsetTop + (cnvs.height / 2));
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
	    	enemyYSpeed *= 2;
	    	enemyXSpeed *= 2;
	    	
	    	askQuestion(function() {
	    		var timeToCreate = Math.floor((Math.random()*3500)+1);
	    setTimeout(createEnemy,timeToCreate); //execute after the given time
	    		
	    	});
	    	
	    	/*
	    	setTimeout(function(){
	    		levelUpText.text = "";
	    	}, 500);
			*/
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
	//ends game and cleans up
	timerText.text = "GAME OVER"; //display GAME OVER
	stage.removeChild(animation); //removes the bat
	stage.removeChild(crossHair); //removes the crosshair
	var si =createjs.Sound.play("gameOverSound"); //play gameOverSound
	clearInterval(gameTimer); //stops and clears the timer	
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
