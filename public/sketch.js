let particles = [];
let cols, rows;
let field;
let noiseScale = 1; // Controls smoothness of the flow field
let speedFactor = 2; // Controls particle speed
let dynamicStrength = 10; // Strength of noise variation
let targetNoiseScale, targetSpeedFactor, targetDynamicStrength;
let initialised = false;
let tracks = [];
let cycleCounter = 1;

function setup() {
    createCanvas(windowWidth, windowHeight);
    loadJSON('test_data', (data) => {
        tracks = data.data;
        let firstTrack = tracks.pop();
        noiseScale = 1 - firstTrack.tonal;
        speedFactor = firstTrack.aggressive;
        dynamicStrength = firstTrack.danceability;

        let secondTrack = tracks.pop();
        targetNoiseScale = 1 - secondTrack.tonal;
        targetSpeedFactor = secondTrack.aggressive;
        targetDynamicStrength = secondTrack.danceability;
        initialised = true;
    });

    cols = floor(width / 10);
    rows = floor(height / 10);
    field = new Array(cols * rows);

    // Initialize particles
    for (let i = 0; i < 500; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    if (!initialised) return;
    background(0, 20); // Slight transparency for trails

    let now = millis();
    if (now > cycleCounter * 10000) {
        cycleCounter++;
        if (tracks.length > 0) {
            let nextTrack = tracks.pop();
            targetNoiseScale = 1 - nextTrack.tonal;
            targetSpeedFactor = nextTrack.aggressive;
            targetDynamicStrength = nextTrack.danceability;
        }
    } else {
        noiseScale = lerp(noiseScale, targetNoiseScale, 0.01);
        speedFactor = lerp(speedFactor, targetSpeedFactor, 0.01);
        dynamicStrength = lerp(dynamicStrength, targetDynamicStrength, 0.01);
    }

    console.log(noiseScale, speedFactor, dynamicStrength);

    // Update flow field
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let angle = noise(x * noiseScale, y * noiseScale, frameCount * 0.01) * TWO_PI * dynamicStrength;
            let index = x + y * cols;
            field[index] = p5.Vector.fromAngle(angle);
        }
    }

    // Update and draw particles
    for (let particle of particles) {
        particle.follow(field);
        particle.update();
        particle.edges();
        particle.show();
    }
}

// Particle class
class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = speedFactor;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    follow(flowField) {
        let x = floor(this.pos.x / 10);
        let y = floor(this.pos.y / 10);
        let index = x + y * cols;
        let force = flowField[index];
        this.applyForce(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    edges() {
        // Wrap around edges
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    show() {
        stroke(255, 100);
        strokeWeight(2);
        point(this.pos.x, this.pos.y);
    }
}