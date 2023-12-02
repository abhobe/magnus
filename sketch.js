// all lengths in meters

let scl = 40; // set viewport size
let fr = 60; // 60hz display frequency

let court = {w: 36, h: 5} // real-life court dims, scaled by scl

// constants for drag
let DENSITY = 1.293
let DRAG_COEFF = 0.6
let MASS = 0.056
let RAD = 0.03
let AREA = 3.14*RAD**2

let objs = [];

// speed + time controls
let paused = false;
let slowf = 10;
let TIME = 0;

function setup() {
  angleMode(DEGREES);
  createCanvas(court.w*scl, court.h*scl);
  p = createVector(0,court.h-1);
  v = createVector(30*cos(7), -30*sin(7));
  a = createVector(0, 9.8);
  w = 2300*3.14/30;
  
  wInp = createInput('2300');
  wInp.position(10, 30);
  wInp.size(30);
  vInp = createInput('30');
  vInp.position(10, 50);
  vInp.size(20);
  tInp = createInput('7');
  tInp.position(10, 70);
  tInp.size(20);
  hInp = createInput('1');
  hInp.position(10, 90);
  hInp.size(20);

  let pauseb = createButton('pause');
  pauseb.position(70, 10);
  pauseb.mousePressed(() => {
    paused = !paused;
  });
  let resetb = createButton('reset');
  resetb.position(10, 10);
  resetb.mousePressed(newSession);

  newSession();
  frameRate(fr)
  console.log(fr)
  fill(0);
}

function newSession() {
  TIME=0;
  p = createVector(0,court.h-float(hInp.value()));
  v = createVector(int(vInp.value())*cos(float(tInp.value())), -1*float(vInp.value())*sin(float(tInp.value())));
  w = float(wInp.value())*PI/30
  objs = [];
  // Projectile Motion
  objs.push(new Ball('projectile', p, v, a, w, color('blue'), false, false));
  //Drag Forces
  objs.push(new Ball('drag', p, v, a, w, color('red'), true, false));
  // Topspin
  objs.push(new Ball('topspin', p, v, a, -w, color('green'), true, true));
  //bottom spin
  objs.push(new Ball('backspin', p, v, a, w, color('orange'), true, true));
}

function draw() {
  if (!paused) {
    background(255);
    fill(0);
    noStroke();
    text("ω (rpm)", wInp.position().x+40, wInp.position().y+15);
    text("v (m/s)", vInp.position().x+40, vInp.position().y+15);
    text("θ (deg)", tInp.position().x+40, tInp.position().y+15);
    text("h (m)",   hInp.position().x+40, hInp.position().y+15);
    TIME += 1/(fr*slowf);

    text(`t: ${round(TIME,2)} (s)`, hInp.position().x, 125);
    rect(width/2, height-scl, scl/5, scl)
    
    text('ball', 150, 15);
    text('pos (m)', 250, 15);
    text('v (m/s)', 350, 15);
    text('a (m/s^2)', 450, 15);
    text('a_drag (m/s^2))', 550, 15);
    text('a_lift (m/s^2)', 650, 15);
    text('t_stop (s)', 750, 15)

    for (let i = 0; i<objs.length;i++) {
      y = 40 + 25 * i;
      obj = objs[i];
      obj.draw();
      noStroke();
      text(`${obj.id}`, 150, y);
      text(`(${round(obj.pos.x,2)}, ${round(court.h - obj.pos.y,2)})`, 250, y);
      text(`(${round(obj.v.x,2)}, ${round(-obj.v.y,2)})`, 350, y);
      text(`(${round(obj.a.x,2)}, ${round(-obj.a.y,2)})`, 450, y);
      text(`(${round(obj.adrag.x,2)}, ${round(-obj.adrag.y,2)})`, 550, y);
      text(`(${round(obj.alift.x,2)}, ${round(-obj.alift.y,2)})`, 650, y);
      text(obj.stop, 750, y);
    }
  }
}

function keyPressed() {
  if (keyCode == 32) {
    paused = !paused;
  } else if (keyCode == BACKSPACE) {
    newSession();
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
    this.stop = NaN;
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
    noStroke();
    fill(this.c);
    if (!this.stop) {
      this.move();
    }
    this.spos = p5.Vector.mult(this.pos, scl);
    this.path.push(this.spos)

    stroke(this.c);
    for (let i=0; i< this.path.length; i++) {
        point(this.path[i].x, this.path[i].y);
    }
    ellipse(this.spos.x, this.spos.y, 10, 10);
    line(this.spos.x, this.spos.y, this.spos.x, this.spos.y+5*9.8)
    line(this.spos.x, this.spos.y, this.spos.x + 5*this.adrag.x, this.spos.y + 5*this.adrag.y)
    line(this.spos.x, this.spos.y, this.spos.x + 5*this.alift.x, this.spos.y + 5*this.alift.y)
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
    
    
    // Stop when hit floor
    if (this.pos.y > court.h) {
      if (!this.stop) {
        this.stop = round(TIME,2);
      }
      this.pos.y = court.h;
    }
  }
}