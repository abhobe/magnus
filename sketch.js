
// Position Variables
let scl = 30;

let fr = 60;

let court = {w: 36, h: 5}

// Drag force 
let DENSITY = 1.293
let DRAG_COEFF = 0.6
let MASS = 0.056
let RAD = 0.03
let AREA = 3.14*RAD**2



let objs = [];

let paused = true;
let slowf = 10;

function setup() {
  angleMode(DEGREES);
  p = createVector(0,court.h-1);
  v = createVector(30*cos(7), -30*sin(7));
  a = createVector(0, 9.8);
  w = 2300*3.14/30;
  
  wInp = createInput('2300');
  wInp.position(10, 30);
  wInp.size(40);
  vInp = createInput('30');
  vInp.position(10, 50);
  vInp.size(40);
  tInp = createInput('10');
  tInp.position(10, 70);
  tInp.size(20);
  
  let pauseb = createButton('pause/start');
  pauseb.position(90, 10);
  pauseb.mousePressed(() => {
    paused = !paused;
  });
  let resetb = createButton('reset/init');
  resetb.position(10, 10);
  resetb.mousePressed(() => {
      v = createVector(int(vInp.value())*cos(int(tInp.value())), -1*int(vInp.value())*sin(int(tInp.value())));
      w = int(wInp.value())*3.14/30
      objs = [];
      // Projectile Motion
      objs.push(new Ball('b', p, v, a, w, color('blue'), false, false));
    //Drag Forces
  objs.push(new Ball('r', p, v, a, w, color('red'), true, false));
  // Topspin
  objs.push(new Ball('r', p, v, a, -w, color('green'), true, true));
    //bottom spin
  objs.push(new Ball('o', p, v, a, w, color('orange'), true, true));
  });
  
  
  
  createCanvas(court.w*scl, court.h*scl);
  frameRate(fr)
  console.log(fr)
  fill(0);
}

function draw() {
  if (!paused) {
    background(255);
    fill(0);
    stroke(0);
    rect(width/2, height-scl, scl/5, scl)
    for (let i = 0; i<objs.length;i++) {
      objs[i].draw();
    }
  }
}

function getDragAccel(velocity, drag_coeff=DRAG_COEFF, density=DENSITY, area=AREA, mass=MASS) {
	return (0.5 * density * drag_coeff * area * velocity**2)/mass;
}


class Ball {
  
  constructor(id, pos, v, a, w, c, dragOn, liftOn) {
    this.pos = pos.copy();
    this.spos = p5.Vector.mult(pos, scl);
    
    this.v = v.copy();
    this.a = a.copy();
    this.ai = a.copy();
    this.id = id;
    this.adrag = createVector(0,0);
    this.alift = createVector(0,0);
    this.w = w; // angular velocity omega
    this.lift_coeff = 0;
    
    
    this.path = []
    this.c = c;
    this.dragOn = dragOn;
    this.liftOn = liftOn;
  }
  
  draw() {
    fill(this.c);
    stroke(this.c);
    this.move();
    this.spos = p5.Vector.mult(this.pos, scl);
    this.path.push(this.spos)
    for (let i=0; i< this.path.length; i++) {
        point(this.path[i].x, this.path[i].y);
    }
    ellipse(this.spos.x, this.spos.y, 10, 10);
    line(this.spos.x, this.spos.y, this.spos.x, this.spos.y+9.8*10)
    line(this.spos.x, this.spos.y, this.spos.x + this.adrag.x*10, this.spos.y + this.adrag.y*10)
    line(this.spos.x, this.spos.y, this.spos.x + this.alift.x*10, this.spos.y + this.alift.y*10)
  }
  
  move() {
    this.pos.add(p5.Vector.div(this.v, fr*slowf));
    this.v.add(p5.Vector.div(this.a, fr*slowf));
    this.a = this.ai.copy();
    if (this.dragOn) {
      this.adrag = p5.Vector.setMag(this.v, -getDragAccel(this.v.mag()))
      this.a.add(this.adrag);
    }
    if (this.liftOn) {
      this.lift_coeff = 1/(2+v.mag()/(RAD*this.w))
      this.alift = p5.Vector.rotate(this.v, 90).setMag(-getDragAccel(this.v.mag(), this.lift_coeff));
      this.a.add(this.alift);
    }
    
    
    // Bounce when touch the edge of the canvas
    if (this.pos.x < 0) {
      this.pos.x=0
    }
    if (this.pos.y < 0) {
      this.pos.y=0
    }
    if (this.pos.x > court.w) {
      this.pos.x=court.w
    }
    if (this.pos.y > court.h) {
       this.v.setMag(0);
       this.a.setMag(0);
       this.pos.y = court.h;
    }
  }
}