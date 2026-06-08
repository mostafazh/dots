let data;
let people = [];
let gridLayout = [];
let hoveredSquare = null;
let scaleFactor = 0.7;

// Fonts are declared as @font-face in style.css and referenced here by family
// name — deliberately NOT loaded via p5's loadFont(). loadFont() backs a font
// with opentype.js, and p5's text() then renders each glyph as a path one
// character at a time, with no BIDI reordering and no contextual letter
// joining. That mirrors and breaks Arabic. Passing a string family name
// instead routes text() through the canvas's native fillText, where the
// browser's text engine applies shaping and RTL layout correctly.
const english = "IBM Plex Mono";
const arabic = "Lifta";

function preload() {
  data = loadJSON(
    "https://data.techforpalestine.org/api/v2/killed-in-gaza.json"
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // <html dir="rtl"> propagates into the canvas as an RTL paragraph
  // direction, which makes the BIDI algorithm push line-end punctuation
  // in the English help text to the visual-left. Pin the canvas to LTR;
  // Arabic strings still lay out RTL via BIDI on their own.
  drawingContext.direction = "ltr";
  noStroke();
  rectMode(CENTER);
  textFont(english);
  if (data) {
    let entries = Object.values(data);
    people = entries.filter(
      (entry) => typeof entry === "object" && entry.en_name
    );
    createGridLayout();
    console.log("TOTAL KILLED:", people.length);
  }
  // font-display: block hides glyphs until the face loads, so wait for both
  // fonts before the first frame to avoid a blank flash on the help text.
  noLoop();
  Promise.all([
    document.fonts.load(`1em "${arabic}"`),
    document.fonts.load(`bold 1em "${english}"`),
  ]).then(() => loop());
}

function createGridLayout() {
  let totalPeople = people.length;
  let unitsPerRow = Math.ceil(Math.sqrt(totalPeople * (width / height)));
  let unitsPerCol = Math.ceil(totalPeople / unitsPerRow);
  let gapX = (width * scaleFactor) / unitsPerRow;
  let gapY = (height * scaleFactor) / unitsPerCol;
  gridLayout = [];
  let personIndex = 0;
  let offsetX = (width - width * scaleFactor) / 2;
  let offsetY = (height - height * scaleFactor) / 2;
  for (let x = 0; x < width * scaleFactor; x += gapX) {
    for (let y = 0; y < height * scaleFactor; y += gapY) {
      if (personIndex < people.length) {
        gridLayout.push({
          x: x + gapX / 2 + offsetX,
          y: y + gapY / 2 + offsetY,
          gapX: gapX,
          person: people[personIndex],
          hover: false,
        });
        personIndex++;
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createGridLayout();
}

function draw() {
  background("#E4312b");

  let isMouseOutsideGrid = true;
  let gridLeft = (width - width * scaleFactor) / 2;
  let gridRight = width - gridLeft;
  let gridTop = (height - height * scaleFactor) / 2;
  let gridBottom = height - gridTop;

  gridLayout.forEach((square) => {
    let noiseValue = noise(square.x * 0.01, square.y * 0.01, frameCount * 0.1);
    let s = map(noiseValue, 0, 2, square.gapX * 0.6, square.gapX * 2);
    let isHovering = dist(mouseX, mouseY, square.x, square.y) < s / 2;
    if (isHovering) {
      hoveredSquare = square;
      isMouseOutsideGrid = false;
    } else if (hoveredSquare === square) {
      hoveredSquare = null;
    }
    if (square === hoveredSquare) {
      fill("#c4db88");
    } else {
      fill("#d9897d");
    }
    circle(square.x, square.y, s,);
  });

  if (hoveredSquare) {
    fill("#c4db88");
    textAlign(CENTER, CENTER);
    let arabicTextSize = width * 0.05;
    let ageTextSize = width * 0.025;
    textSize(arabicTextSize);
    textFont(arabic);
    text(hoveredSquare.person.name, width / 2, height / 2);
    textFont(english);
    textSize(ageTextSize);
    text(
      "AGE: " + `${hoveredSquare.person.age}`,
      width / 2,
      height / 2 + arabicTextSize
    );
  } else if (
    mouseX < gridLeft ||
    mouseX > gridRight ||
    mouseY < gridTop ||
    mouseY > gridBottom
  ) {
    fill(0);
    textSize(width * 0.015);
    textAlign(CENTER, CENTER);
    text(
      `EACH DOT REPRESENTS A PERSON KILLED IN GAZA SINCE OCTOBER 7, 2023:

BASED ON REPORTS FROM GAZA'S MINISTRY OF HEALTH & GOVERNMENT MEDIA OFFICE,
AGGREGATED BY TECH FOR PALESTINE.

MANY NAMES ARE MISSING DUE TO LACK OF IDENTIFICATION,
RECORDS, OR DIRECT LINKAGE TO ISRAELI AGGRESSION.`,
      width / 2,
      height / 2
    );
  }
}
