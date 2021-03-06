const $ = require('jquery');
const Assets = require('./asset_manager');

var Game = function(canvas, context) {
  this.size = {
    x: canvas.width,
    y: canvas.height
  };
  this.assets = new Assets({ x: this.size.x, y: this.size.y });
  this.backgroundObjects = [this.assets.randomBackgroundObject()];
  this.jeepney = this.assets.jeepney();
  this.obstacles = [this.assets.randomObstacle()];
  this.background = this.assets.background('ground');
  this.clouds = [this.assets.background('cloud')];
  this.playing = false;
  this.gameOver = false;

  var gameAnimation = function() {
    if (this.playing) {
      this.update();
      this.draw(context);
      requestAnimationFrame(gameAnimation);
    } else {
      requestAnimationFrame(gameAnimation);
      this.endGame(context);
    }
  }.bind(this);

  gameAnimation();
};

Game.prototype.startUp = function(){
  this.playing = true;
  document.getElementById('not-playing').id = 'playing';
};

Game.prototype.shutDown = function(){
  this.playing = false;
};

Game.prototype.update = function() {
  var jeepney = this.jeepney;

  this.generateBackgroundObjects();
  this.generateObstacles();
  this.generateClouds();
  this.setBackgroundObjects(jeepney);
  this.setObstacles(jeepney);
  this.setClouds();

  jeepney.update();

  this.checkJeepneyHealth();
};

Game.prototype.generateClouds = function() {
  var firstCloud = this.clouds[0];
  var lastCloud = this.clouds[this.clouds.length - 1];

  if (firstCloud.x < 0 - firstCloud.width) {
    this.clouds.shift();
  } else if (lastCloud.x + lastCloud.width < this.size.x - Math.random() * 5000 - 40) {
    this.clouds.push(this.assets.background('cloud'));
  }
};

Game.prototype.generateBackgroundObjects = function() {
  var firstbackgroundObject = this.backgroundObjects[0];
  var lastbackgroundObject = this.backgroundObjects[this.backgroundObjects.length - 1];

  if (firstbackgroundObject.x < 0 - firstbackgroundObject.width) {
    this.backgroundObjects.shift();
  } else if (lastbackgroundObject.x + lastbackgroundObject.width < this.size.x - Math.random() * 50 - 10) {
    this.backgroundObjects.push(this.assets.randomBackgroundObject(lastbackgroundObject));
  }
};

Game.prototype.generateObstacles = function() {
  var firstObstacle = this.obstacles[0];
  var lastObstacle = this.obstacles[this.obstacles.length - 1];
  var minDistanceBetweenObstacles = this.size.x - Math.random() * 5000 - this.jeepney.width * 2;

  if (!firstObstacle || lastObstacle.x + lastObstacle.width < minDistanceBetweenObstacles) {
    this.obstacles.push(this.assets.randomObstacle());
  } else if (
    firstObstacle.x + firstObstacle.width < 0 ||
    firstObstacle.x > this.size.x ||
    firstObstacle.y > this.size.y
  ) {
    this.obstacles.shift();
  }
};

Game.prototype.setBackgroundObjects = function() {
  this.backgroundObjects.forEach(function(backgroundObject) {
    backgroundObject.update();
  });
};

Game.prototype.setClouds = function() {
  this.clouds.forEach(function(cloud){
    cloud.update();
  });
};

Game.prototype.setObstacles = function(jeepney) {
  var validObstacles = this.obstacles.filter(function(obstacle) {
    return !obstacle.hitByJeepney;
  });
  var hitObstacles = this.obstacles.filter(function(obstacle) {
    return obstacle.hitByJeepney;
  });

  validObstacles.forEach(function(obstacle) {
    if (jeepney.isColliding(obstacle)) {
      jeepney.loseHealth();
      obstacle.processColission(jeepney);
    }
    obstacle.update();
  });

  hitObstacles.forEach(function(obstacle) {
    obstacle.update();
  });
};

Game.prototype.checkJeepneyHealth = function() {
  if (this.jeepney.isDead()) {
    localStorage.lastScore = this.jeepney.score;
    this.gameOver = true;
    this.shutDown();
    $('.game-status')[0].id = 'not-playing';
  }
};

Game.prototype.endGame = function(context) {
  this.playing = false;
  context.clearRect(0, 0, this.size.x, this.size.y);
  this.drawStart(context);
  if (!localStorage.highScore || this.jeepney.score > localStorage.highScore) {
    localStorage.highScore = this.jeepney.score;
    $('#high-score').text(this.jeepney.score);
  }
};

Game.prototype.draw = function(context) {
  context.clearRect(0, 0, this.size.x, this.size.y);
  context.fillStyle = "darkGray";
  context.fillRect(0, 300, this.size.x, 65);
  this.background.draw(context);

  this.clouds.forEach(function(cloud){
    cloud.draw(context);
  });

  this.backgroundObjects.forEach(function(backgroundObject) {
    backgroundObject.draw(context);
  });

  this.jeepney.draw(context);

  this.obstacles.forEach(function(obstacle) {
    obstacle.draw(context);
  });

  this.drawScore(context);
  this.drawHealth(context);
};

Game.prototype.drawScore = function(context) {
  context.font = '30px VT323';
  context.fillStyle = 'black';
  context.fillText("Score: " + this.jeepney.score, 50, 48);
};

Game.prototype.drawLastScore = function(context) {
  context.font = '50px Waiting for the Sunrise';
  context.fillStyle = 'black';
  context.fillText("Last Score: " + localStorage.lastScore, 315, 100);
  let img = new Image();
  img.src = '/assets/images/restart.png';
  context.drawImage(img, 1, 1, 898, 398);
};

Game.prototype.drawHealth = function(context) {
  var x = 825;
  for (var i = 0; i < this.jeepney.health; i++) {
    var img = new Image();
    img.src = 'assets/images/heart.png';
    context.drawImage(img, x, 25, 30, 30);
    x -= 45;
  }
};

Game.prototype.drawStart = function(context){
  if (this.gameOver === true) {
    this.drawLastScore(context);
  }
  if (this.gameOver === false){
    let img = new Image();
    img.src = '/assets/images/start.png';
    context.drawImage(img, 1, 1, 898, 398);
  }
};
module.exports = Game;
