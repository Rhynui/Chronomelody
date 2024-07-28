/**
 * Author      : Isaac Zhou
 * Course Code : ICS2O1-05
 * Date Created: Jun 16, 2022
 * Last Updated: Jun 25, 2022
 * Description : The proposed game.
 * Game Link   : https://final-game-rogsh3.ics2o-r.repl.co
 * Code Link   : https://replit.com/@ICS2O-R/Final-Game-rogsh3
 */

/**
 * Judgment Windows
 * Perfect - +-50ms
 * Great   - +-100ms
 * Good    - +-150ms
 * Bad     - +-200ms
 */

/* Accuracies
 * Perfect - 100%
 * Great   - 60%
 * Good    - 30%
 * Bad     - 10%
 * Miss    - 0%
 */

const FRAMERATE = 60;
const NOTE_WIDTH = 60;
const NOTE_HEIGHT = 24;
const OFFSET = 200; // delay notes to compensate audio delay
const INITIAL_WAIT = 3000; // the waiting period in milliseconds after the player selects a song to play
const SPEED_DIVISOR = 20;

// page states
const MENU = 0;
const SONG_SELECT = 1;
const SETTING = 2;
const TUTORIAL = 3;
const GAME = 4;
const PAUSE = 5;
const RESULT = 6;
const EXIT = 7;

// judgment states
const PERFECT = 0;
const GREAT = 1;
const GOOD = 2;
const BAD = 3;
const MISS = 4;
const NONE = 5;

const THEME_COLOR = "rgb(52,73,94)";
const JUDGMENT_COLORS = [
  [
    "rgb(212,172,13)",
    "rgb(34,153,84)",
    "rgb(46,134,193)",
    "rgb(136,78,160)",
    "rgb(203,67,53)"
  ], 
  [
    "rgb(247,220,111)",
    "rgb(125,206,160)",
    "rgb(133,193,233)",
    "rgb(195,155,211)",
    "rgb(241,148,138)"
  ]
];
const DIFFICULTY_COLORS = ["blue", "green", "orange", "red", "purple", "black"];
const SCORES = [100, 60, 30, 10, 0]; // set scores achieved for each type of judgment out of 100

var tutorialImages = [];

var noteSpeed = 5; // the speed of which the notes fall at
var customOffset = 0; // offset determined by the player; adding on to the fixed OFFSET
var changeByTen = false; // allow offset to be increased and decreased by 10 instead of 1

var startTime; // the start time of the program in milliseconds obatained from Date.now()

var nSong = SONGS.length;
var page = MENU;
var tutorialPage = 0;

// key bindings
var keys = ['d', 'f', 'j', 'k'];
var keysPressed;
var selectedKey;

var selectedIndex = 0; // the index in SONGS of the selected song
var currentSong;
var clickSound;

var songStartTime;
var songCurrentTime;
var songStopTime;

var chartCursor;
var notesQueues;

var combo;
var maxCombo;
var totalScore;
var nNote;
var accuracy;
var counts; // track the number of perfects, greats, goods, bads, and misses
var nEarly, nLate; // track the number of early and late hits

var currentJudgmentState;
var currentJudgmentEarly; // stores if the player hit the note too early or too late for the current note; true if the player hits too early and false if the player hits too late
var judgmentStartTime; // the time in millisecond of the most recent changes to the variable currentJudgmentState

var wait = false;
var waitTime;
var waitStart;

// for testing
// page = RESULT;
// currentSong = SONGS[21];
// maxCombo = 1023;
// accuracy = 99.737;
// counts = [1290,2,1,1,1];
// nEarly = 2;
// nLate = 2;

function newSongSelected() {
  // runs when a new song is selected
  currentSong = SONGS[selectedIndex];
  currentSong.audio.play();
  currentSong.audio.jump(currentSong.previewTime/1000);
  currentSong.audio.setVolume(0.5);
}

function showDifficulty(diff) {
  // shows the difficulty of the selected song
  noStroke();
  fill(DIFFICULTY_COLORS[min(5,floor((diff-1)/5))]);
  rectMode(CENTER);
  square(675,425,80);
  fill(255);
  textAlign(CENTER,CENTER);
  textSize(16);
  text("Difficulty",675,405);
  textSize(40);
  text(diff,675,440);
}

function gameInit() {
  // runs when the player starts a song
  chartCursor = 0;
  keysPressed = [false, false, false, false];
  notesQueues = [[], [], [], []];
  songStartTime = Date.now()+INITIAL_WAIT;
  combo = 0;
  maxCombo = 0;
  totalScore = 0;
  nNote = 0;
  accuracy = 100;
  counts = [0, 0, 0, 0, 0];
  nEarly = 0;
  nLate = 0;
}

function drawKeys() {
  // draws the bindings of the keys and highlights the keys when they are pressed
  rectMode(CENTER);
  noStroke();
  textAlign(CENTER,CENTER);
  textSize(32);
  for (let i = 0; i < 4; ++i) {
    if (keysPressed[i]) {
      fill(255);
    } else {
      fill(0);
    }
    rect(280+i*NOTE_WIDTH+NOTE_WIDTH/2,451,NOTE_WIDTH,98); // increase the y-value and decrease the height a bit to avoid the borders blocking the judgment line
    if (keysPressed[i]) {
      fill(0);
    } else {
      fill(255);
    }
    text(keys[i].toUpperCase(),280+i*NOTE_WIDTH+NOTE_WIDTH/2,450);
  }
}

function progressBar() {
  // draws a progrees bar on the top of the screen that shows the progress of the current song
  noStroke();
  fill(160);
  rectMode(CORNER);
  rect(0,0,songCurrentTime*800/currentSong.audio.duration()/1000,5);
}

function ifDisplay(time) {
  // checks if the note is within the display range
  if (400-(time+OFFSET+customOffset-songCurrentTime)*noteSpeed/SPEED_DIVISOR >= 0) {
    return true;
  } else {
    return false;
  }
}

function moveNotes() {
  // maintains a queue that contains all the notes being displayed on the screen at the moment
  // adds new notes that enters the display range to the queue and moves the existing notes downwards

  // increase y-values for notes in the queues
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < notesQueues[i].length; ++j) {
      notesQueues[i][j].startY = 400-(currentSong.chart[notesQueues[i][j].index][1]+OFFSET+customOffset-songCurrentTime)*noteSpeed/SPEED_DIVISOR;
      if (notesQueues[i][j].type) {
        notesQueues[i][j].endY = 400-(currentSong.chart[notesQueues[i][j].index][2]+OFFSET+customOffset-songCurrentTime)*noteSpeed/SPEED_DIVISOR;
      }
    }
  }
  
  // push all notes that approached the playfield
  while (chartCursor < currentSong.chart.length) {
    let currentNote = currentSong.chart[chartCursor];
    if (ifDisplay(currentNote[1])) {
      notesQueues[currentNote[0]].push({
        index: chartCursor,
        type: currentNote[2] != -1, // true if the note is a hold note; false if the note is a tap note
        startY: 400-(currentNote[1]+OFFSET+customOffset-songCurrentTime)*noteSpeed/SPEED_DIVISOR,
        endY: currentNote[2] == -1 ? 0 : 400-(currentNote[2]+OFFSET+customOffset-songCurrentTime)*noteSpeed/SPEED_DIVISOR,
        holded: false,
        greyed: false
      });
      ++chartCursor;
    } else {
      break;
    }
  }
}

function drawNote(lane,y,height,hold,greyed) {
  // draws note at the given location
  strokeWeight(2);
  rectMode(CORNER);
  if (lane == 0 || lane == 3) {
    fill("white");
  } else {
    fill("cyan");
  }
  if (hold) {
    stroke("red");
    rect(lane*NOTE_WIDTH+280+1,y,NOTE_WIDTH-2,height);
    if (greyed) {
      // dim the hold note if the hold note is greyed out
      fill(0,120);
      rect(lane*NOTE_WIDTH+280+1,y,NOTE_WIDTH-2,height);
    }
  } else {
    noStroke();
    rect(lane*NOTE_WIDTH+280,y,NOTE_WIDTH,NOTE_HEIGHT);
  }
}

function displayNotes() {
  // displays all notes in the queues to their appropriate position
  for (let i = 0; i < 4; ++i) {    
    for (let j = 0; j < notesQueues[i].length; ++j) {
      if (notesQueues[i][j].type) {
        if (notesQueues[i][j].holded) {
          drawNote(i,notesQueues[i][j].endY,max(min(notesQueues[i][j].startY,400)-notesQueues[i][j].endY,0),true,false);
        } else {
          drawNote(i,notesQueues[i][j].endY,notesQueues[i][j].startY-notesQueues[i][j].endY,true,notesQueues[i][j].greyed);
        }
      } else {
        drawNote(i,notesQueues[i][j].startY-NOTE_HEIGHT,NOTE_HEIGHT,false,false);
      }
    }
  }
}

function judgmentState(hitTime,time) {
  // determines the judgment state from the given timings
  time += OFFSET + customOffset;
  let difference = hitTime - time;
  let returnValue = {
    state: NONE,
    early: false
  };
  if (difference < 0) {
    returnValue.early = true;
  }
  if (abs(difference) <= 50) {
    returnValue.state = PERFECT;
  } else if (abs(difference) <= 100) {
    returnValue.state = GREAT;
  } else if (abs(difference) <= 150) {
    returnValue.state = GOOD;
  } else if (abs(difference) <= 200) {
    returnValue.state = BAD;
  } else {
    returnValue.state = MISS;
  }
  return returnValue;
}

function setJudgmentState(state,early) {
  // updates the judment state on the display and other relavent information
  ++nNote;
  totalScore += SCORES[state];
  accuracy = totalScore / nNote;
  ++counts[state];
  if (state != PERFECT && state != MISS) {
    if (early) {
      ++nEarly;
    } else {
      ++nLate;
    }
  }
  if (state != MISS) {
    ++combo;
    maxCombo = max(maxCombo,combo);
  } else {
    combo = 0;
  }
  currentJudgmentState = state;
  currentJudgmentEarly = early;
  judgmentStartTime = Date.now();
}

function missJudge() {
  // runs continously to check if the player missed
  let returnValue;
  let currentNote;
  for (let i = 0; i < 4; ++i) {
    if (notesQueues[i].length) {
      // if the queue isn't empty
      currentNote = notesQueues[i][0];
      if (currentNote.type) {
        if (!currentNote.holded && !currentNote.greyed) {
          returnValue = judgmentState(songCurrentTime,currentSong.chart[currentNote.index][1]);
          if (returnValue.state == MISS && !returnValue.early) {
            currentNote.greyed = true;
            setJudgmentState(MISS,false);
          }
        }
        returnValue = judgmentState(songCurrentTime,currentSong.chart[currentNote.index][2]);
        if (returnValue.state == MISS && !returnValue.early) {
          setJudgmentState(MISS,false);
          notesQueues[i].shift();
        }
      } else {
        returnValue = judgmentState(songCurrentTime,currentSong.chart[currentNote.index][1]);
        if (returnValue.state == MISS && !returnValue.early) {
          setJudgmentState(MISS,false);
          notesQueues[i].shift();
        }
      }
    }
  }
}

function pressedJudge(lane) {
  // runs when a key is pressed
  if (notesQueues[lane].length) {
    // if the queue isn't empty
    let currentNote = notesQueues[lane][0];
    if (currentNote.type) {
      // if the note is a hold note
      if (!currentNote.holded && !currentNote.greyed) {
        // if the player hasn't tap the hold note
        let returnValue = judgmentState(songCurrentTime,currentSong.chart[currentNote.index][1]);
        if (returnValue.state != MISS) {
          // if the player taps the start of the hold note within the timing window
          currentNote.holded = true;
          setJudgmentState(returnValue.state,returnValue.early);
        }
      }
    } else {
      // if the note is a tap note
      let returnValue = judgmentState(songCurrentTime,currentSong.chart[currentNote.index][1]);
      if (returnValue.state != MISS) {
        // if the player hit the note within the timing window
        setJudgmentState(returnValue.state,returnValue.early);
        notesQueues[lane].shift();
      }
    }
  }
}

function releasedJudge(lane) {
  // runs when a key is released
  if (notesQueues[lane].length) {
    // if the queue isn't empty
    let currentNote = notesQueues[lane][0];
    if (currentNote.type && currentNote.holded && !currentNote.greyed) {
      // if the player tapped on the hold note and hasn't released the key
      let returnValue = judgmentState(songCurrentTime,currentSong.chart[currentNote.index][2]);
      setJudgmentState(returnValue.state,returnValue.early);
      if (returnValue.state != MISS) {
        // if the player released the key within the timing window
        notesQueues[lane].shift();
      } else {
        // if the player released the key too early
        currentNote.holded = false;
        currentNote.greyed = true;
      }
    }
  }
}

function showStats() {
  // displays the current judgment state, combo, and accuracy
  noStroke();
  textAlign(CENTER,CENTER);
  let currentTime = Date.now() - judgmentStartTime;

  // show combo
  fill(255);
  textSize(8);
  text("COMBO",400,80);
  if (currentTime <= 50 && combo) {
    textSize(32)
  } else {
    textSize(28);
  }
  text(combo,400,100);

  // show accuracy
  textSize(12);
  text(nf(accuracy,2,2)+"%",400,180);
  
  // show judgment state
  if (currentJudgmentState != NONE) {    
    if (currentTime <= 50) {
      colors = JUDGMENT_COLORS[1];
      textSize(28)
    } else if (currentTime <= 1000) {
      colors = JUDGMENT_COLORS[0];
      textSize(24);
    } else {
      currentJudgmentState = NONE;
      return;
    }
    switch (currentJudgmentState) {
      case PERFECT:
        fill(colors[0]);
        text("PERFECT",400,150);
        break;
      case GREAT:
        fill(colors[1]);
        text("GREAT",400,150);
        break;
      case GOOD:
        fill(colors[2]);
        text("GOOD",400,150);
        break;
      case BAD:
        fill(colors[3]);
        text("BAD",400,150);
        break;
      case MISS:
        fill(colors[4]);
        text("MISS",400,150);
        break;
    }
    if (currentJudgmentState != PERFECT) {      
      textSize(8);
      if (currentJudgmentEarly) {
        fill("blue");
        text("EARLY",400,130);
      } else {
        fill("red");
        text("LATE",400,130);
      }
    }
  }
}

function preload() {
  // loads the audio and image of the songs, and the mouse click sound effect
  soundFormats("mp3");
  for (let i = 0; i < nSong; ++i) {
    SONGS[i].audio = loadSound("Songs/"+SONGS[i].folder+"/audio");
    SONGS[i].image = loadImage("Songs/"+SONGS[i].folder+"/image.jpg");
  }
  for (let i = 0; i < 7; ++i) {
    tutorialImages.push(loadImage("Tutorial/"+i+".png"));
  }
  clickSound = loadSound("click");
}

function setup() {
  createCanvas(800, 500);
  imageMode(CENTER);
  frameRate(FRAMERATE);
  startTime = Date.now();
}

function draw() {
  switch (page) {
    case MENU:
      background(THEME_COLOR);
      noStroke();
      fill(255);
      textAlign(CENTER,CENTER);
      textSize(64);
      text("Chronomelody",400,150);
      textSize(32);
      text("Play",400,240);
      text("Options",400,300);
      text("Tutorial",400,360);
      text("Exit",400,420);

      fill(174,182,191);
      // highlight the text when the mouse hover over it
      if (mouseY >= 225 && mouseY < 425) {
        if (mouseY < 325) {
          if (mouseY < 275) {
            text("Play",400,240);
          } else {
            text("Options",400,300);
          }
        } else {
          if (mouseY < 375) {
            text("Tutorial",400,360);
          } else {
            text("Exit",400,420);
          }
        }
      }
      break;
    case SONG_SELECT:      
      if (abs(currentSong.audio.currentTime()*1000-currentSong.audio.duration()*1000) < 1000/FRAMERATE) {
        newSongSelected();
      }
      background(THEME_COLOR);

      // dim the clickable area of arrows, "back" button, and "start" button when the mouse hover over it
      noStroke();
      fill(0,160);
      rectMode(CENTER);
      if (mouseY >= 190 && mouseY <= 310) {
        if (mouseX >= 0 && mouseX <= 80) {
          rect(40,250,80,120);
        } else if (mouseX >= 720 && mouseX <= 800) {
          rect(760,250,80,120);
        }
      }
      if (mouseX >= 300 && mouseX <= 500 && mouseY >= 410 && mouseY <= 470) {
        // if the mouse hovers over the "start" button
        rect(400,440,200,60);
      }
      if (mouseY >= 440 && mouseY <= 500 && mouseX >= 0 && mouseX <= 200) {
        // if the mouse hovers over the "back" button
        rect(100,470,200,60);
      }
      
      // draw left and right arrows
      stroke(255);
      strokeWeight(8);
      line(30,250,50,230);
      line(30,250,50,270);
      line(770,250,750,230);
      line(770,250,750,270);

      // display information of the selected song and chart
      noStroke();
      fill(255);
      textAlign(CENTER,CENTER);
      textSize(32);
      text(currentSong.title,400,50);
      textSize(20);
      text(currentSong.artist,400,80);
      image(currentSong.image,400,250,currentSong.image.width*250/currentSong.image.height,250);
      textSize(14);
      text("Duration: "+(floor(currentSong.audio.duration()/60)+":"+(nf(round(currentSong.audio.duration())%60,2,0))),250,110);
      text("BPM: "+currentSong.bpm,400,110);
      text("Mapper: "+currentSong.mapper,550,110);
      textSize(32);
      text("Start",400,440);
      text("Back",100,470);
      showDifficulty(currentSong.difficulty);
      break;
    case SETTING:
      background(THEME_COLOR);
      noStroke();
      rectMode(CENTER);
      fill(0,160);
      if (mouseY >= 75 && mouseY <= 125) {
        if (mouseX >= 325 && mouseX <= 375) {
          // if the mouse hovers over the decrease speed button
          square(350,100,50);
        } else if (mouseX >= 425 && mouseX <= 475) {
          // if the mouse hovers over the increase speed button
          square(450,100,50);
        }
      } else if (mouseY >= 175 && mouseY <= 225) {
        if (mouseX >= 325 && mouseX <= 375) {
          // if the mouse hovers over the decrease offset button
          square(350,200,50);
        } else if (mouseX >= 425 && mouseX <= 475) {
          // if the mouse hovers over the increase offset button
          square(450,200,50);
        }
      }
      if (mouseY >= 440 && mouseY <= 500 && mouseX >= 0 && mouseX <= 200) {
        // if the mouse hovers over the "back" button
        rect(100,470,200,60);
      }
      textAlign(CENTER,CENTER);
      fill(255);
      textSize(32);
      text("Back",100,470);

      textSize(32);
      text("-",350,100);
      text("+",450,100);
      text("-",350,200);
      text("+",450,200);

      textSize(24);
      text("Speed",400,50);
      text(noteSpeed,400,100);
      text("Offset",400,150);
      text(customOffset,400,200);
      text("Key Bindings",400,275);
      for (let i = 0; i < 4; ++i) {
        text(keys[i].toUpperCase(),i*50+325,325);
      }
      stroke(255);
      strokeWeight(2);
      noFill();
      for (let i = 0; i < 4; ++i) {
        square(i*50+325,325,50);
      }
      if (selectedKey != -1) {
        fill(200);
        square(selectedKey*50+325,325,60);
      }
      break;
    case TUTORIAL:
      background(THEME_COLOR);
      noStroke();
      
      // dim buttons when the mouse hovers over them
      rectMode(CENTER);
      fill(0,160);
      if (mouseY >= 440 && mouseY <= 500) {
        if (mouseX >= 0 && mouseX <= 200) {
          rect(100,470,200,60);
        } else if (mouseX >= 600 && mouseX <= 800) {
          rect(700,470,200,60);
        }
      }

      // display text on the button depending which page the player is on
      textAlign(CENTER,CENTER);
      fill(255);
      textSize(32);
      if (tutorialPage == 0) {
        // if the player is on the first page
        text("Back",100,470);
        text("Next",700,470);
      } else if (tutorialPage == 21) {
        //if the player is on the last page
        text("Previous",100,470);
        text("Finish",700,470);
      } else {
        text("Previous",100,470);
        text("Next",700,470);
      }
      switch (tutorialPage) {
        case 0:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Introduction",50,50);
          textAlign(CENTER,CENTER);
          textSize(24);
          text("Welcome to the game's tutorial!\n\nIn this tutorial, you will learn the basic mechanics of the game,\nhow to navigate through the pages,\nand change settings to suit your preference.",400,250);
          break;
        case 1:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Menu",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("In the game's menu, there are four option to choose from.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[0],400,325,400,250);
          break;
        case 2:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Menu",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("\"Play\" brings you to the actual game,\n\"Options\" shows you to game settings that are customizable,\n\"Tutorial\" brings you to this tutorial, and \"Exit\" ends the game.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[0],400,325,400,250);
          break;
        case 3:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Menu",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Hover over and click the option you choose. If you want to return back to the menu on any of three pages shown in the menu,\nclick \"Back\" if there is one on the screen, or press Escape on your keyboard.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[0],400,325,400,250);
          break;
        case 4:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Song Selection",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("In the Song Selection page, you are choosing the song you want to play.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[1],400,325,400,250);
          break;
        case 5:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Song Selection",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("You will see information about the song and the chart, and hear a short preview of the song.\nThis also includes the difficulty of the song. The larger the number, the harder the chart of the song is.\nHarder songs tends to have denser notes, more complex patterns, and require higher skills to play.\nAlso, it shows you the song's tilte, the song's artist, the duration of the song, the tempo of the song,\nand the creator of the song's chart.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[1],400,325,400,250);
          break;
        case 6:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Song Selection",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("You can click the left and right arrows on left- and right-hand side of the screen or\npress the Left and Right Arrow keys on your keyboard to switch to the previous or the next song.\nThe songs are sorted from the easiest to the hardest,\nso the previous song will be easier (if the selected song is not the easiest),\nand the next will be harder (if the selected song is not the hardest).\nIf you have chosen the song you want to play, click \"Start\" or press Enter on your keyboard.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[1],400,325,400,250);
          break;
        case 7:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Game",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("This is what you will see after you clicked \"Start\" in the song selection page.\nIf you want to exit this page and return back to the Song Selection page, hit the Escape key on your keyboard.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[2],400,325,400,250);
          break;
        case 8:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Game",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Every note will fall down in one of the four vertical lanes when the song is playing,\nand your task is to hit the notes once they reach the judgment line,\nwhich is the white horizontal line that is close to the bottom of the screen.\nEach lanes has a corresponding key to it shown under the judgment line.\nUse that key on your keyboard to hit the notes on that lane.\nNotes in the middle two lanes will be shown in cyan, and notes in the outer two lans will be shown in white.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[2],400,325,400,250);
          break;
        case 9:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Game",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("On the top of the screen, there is a progress bar that tells you how much of the song has passed.\nThe number under \"COMBO\" tells you your current combo,\nthe text under that tells you the judgment of your hit on the last note,\nand whether you hit the note too early or too late.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[2],400,325,400,250);
          break;
        case 10:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Game",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Judgment can be one of the following six:\nPefect, Great, Good, Bad, and Miss, sorting from the best to the worst.\nPerfect means you hit the last note perfectly, and Miss means you completely missed the last note.\nAny judgment other than Miss will increase your combo by one, and Miss will reset your combo to zero.\nThe jugement also affects your accuracy, which is shown below the judgment as percentage.\nThe closer you get to Perfect, the higher your accuracy will be.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[2],400,325,400,250);
          break;
        case 11:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Note Types",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("There are two types of notes in this game. The notes shown here are tap notes.\nYou are only required to tap the corresponding key once when the bottom of them touches the judgment line.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[3],400,325,400,250);
          break;
        case 12:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Note Types",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("The notes shown here are hold notes.\nThey are outlined in red, and you are required to hold the corresponding key\nwhen the bottom of them touches the judgment line the and release the key when the top of them reach the judgment line.\nThis type of notes produces two sperate judgments;\none for the timing of your tapping action and the other for the timing of your releasing action.",400,135)
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[4],400,325,400,250);
          break;
        case 13:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Reuslt",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("After the song has finished, the game will automatically bring you to the Result page.\nIn the Result page, you can see your perfomance of the play you just had.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[5],400,325,400,250);
          break;
        case 14:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Reuslt",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Apart from the number of Perfects, Greats, Goods, Bads, Misses you had;\nyour accuracy; and your maximum combo, this page also shows a letter grade based on your accuracy.\nThe higher your accuracy was, the higher your grade will be.\nThe highest grade is SS, which you need an 100% accuracy or all Perfects to achieve.\nThe other grades are S, A, B, C, and D, sorted from highest to lowest.\nIf you achieve a grade lower than A, the song may be too hard for you or you may have a wrong offset.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[5],400,325,400,250);
          break;
        case 15:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Reuslt",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("After you are done seeing your result, you can either play the song again by clicking \"Retry\",\nor exit to the Song Selection page by clicking \"Continue\" or pressing Escape key on your keyboard.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[5],400,325,400,250);
          break;
        case 16:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Options",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Here in the Options page, you can modify settings of the game.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[6],400,325,400,250);
          break;
        case 17:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Options",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Speed determines the speed of which the notes falls at. The higher the speed, the quicker the notes fall.\nHigher speed makes the chart more readable as notes are more stretched out,\nbut it also requires shorter reaction time.\nTry to set the speed as fast as possible as long as your reaction can keep up with it.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[6],400,325,400,250);
          break;
        case 18:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Options",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
        text("Offset delays the timing of which the notes hit the judgment line in miliseconds.\nIf you think the notes are off-beat or you are constantly hitting Earlys or Lates,\nyou can consider changing the offset. A positive offset makes all notes hit the judgment line later,\nand a negative offset makes all notes hit the judgment line earlier.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[6],400,325,400,250);
          break;
        case 19:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Options",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
        text("On the Result screen, if you see more Lates than Early's, you can consider increasing the offset,\nand if you see more Early's than Lates, you can consider decreasing the offset.\nSince offset can be very large, you can hold on to your Shift key while\nclicking the plus or minus arrow to increase or decrease the offset by ten instead of one.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[6],400,325,400,250);
          break;
        case 20:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("Options",50,50);
          textAlign(CENTER,CENTER);
          textSize(16);
          text("Under \"Key Bindings\", you can change the keys you use when hitting the notes in the game.\nClick on the key you want to change and press a new key on your keyboard.\nThe change is successful if you see the key in the box you clicked has changed. If that is the case,\nthe new key will be the key you need to press when hitting the notes on the key's corresponding lane.",400,135);
          strokeWeight(2);
          stroke(255);
          rect(400,325,400,250);
          image(tutorialImages[6],400,325,400,250);
          break;
        case 21:
          textAlign(LEFT,CENTER);
          textSize(32);
          text("End",50,50);
          textAlign(CENTER,CENTER);
          textSize(24);
          text("That is the end of the tuorial.\nHave fun playing the game!\nYou can alway come back to this tutorial by clicking \"Tutorial\" in the menu.",400,250);
          break;
      }
      break;
    case GAME:
      songCurrentTime = Date.now() - songStartTime; // calculate the number of miliseconds that has passed since the start of the song
      if (wait) {
        if (Date.now() - waitStart >= INITIAL_WAIT) {
          // if the waiting period at the start of the song has passed
          currentSong.audio.play();
          currentSong.audio.setVolume(0.5);
          wait = false;
        }
      }
      if (songCurrentTime >= currentSong.audio.duration()*1000) {
        // if the song has ended
        page = RESULT;
      }
      background(0);
      stroke(255);
      strokeWeight(3);
      line(200,400,600,400);
      moveNotes();
      missJudge();
      drawKeys();
      displayNotes();
      progressBar();
      showStats();
      break;
    case PAUSE:
      background(0);
      stroke(255);
      strokeWeight(3);
      line(200,400,600,400);
      drawKeys();
      displayNotes();
      progressBar();
      showStats();
      background(0,225);

      rectMode(CENTER);
      stroke(255);
      strokeWeight(5);
      textAlign(CENTER,CENTER);
      if (mouseX >= 250 && mouseX <= 550 && mouseY >= 50 && mouseY <= 150) {
        fill(THEME_COLOR);
      } else {
        fill(0,0);
      }
      rect(400,100,300,100);
      if (mouseX >= 250 && mouseX <= 550 && mouseY >= 200 && mouseY <= 300) {
        fill(THEME_COLOR);
      } else {
        fill(0,0);
      }
      rect(400,250,300,100);
      if (mouseX >= 250 && mouseX <= 550 && mouseY >= 350 && mouseY <= 450) {
        fill(THEME_COLOR);
      } else {
        fill(0,0);
      }
      rect(400,400,300,100);
      break;
    case RESULT:
      background(THEME_COLOR);
      
      // dim the "retry" button and the "continue" button if the mouse hovers over them
      noStroke();
      fill(0,160);
      rectMode(CENTER);
      if (mouseY >= 440 && mouseY <= 500) {
        if (mouseX >= 0 && mouseX <= 200) {
          rect(100,470,200,60);
        } else if (mouseX >= 600 && mouseX <= 800) {
          rect(700,470,200,60);
        }
      }
      
      // display information about the play
      fill(255);
      textAlign(CENTER,CENTER);
      textSize(32);
      text(currentSong.title,400,80);
      
      textSize(20);
      text(currentSong.artist,400,110);
      
      textSize(24);
      text("Accuracy: "+nf(accuracy,2,2)+"%",400,150);
      
      textSize(20);
      text("Max Combo: "+maxCombo+"x",400,180);
      
      textAlign(LEFT,CENTER);
      textSize(20);
      fill(JUDGMENT_COLORS[0][PERFECT]);
      text("Perfect",200,225);
      fill(JUDGMENT_COLORS[0][GREAT]);
      text("Great",200,250);
      fill(JUDGMENT_COLORS[0][GOOD]);
      text("Good",200,275);
      fill(JUDGMENT_COLORS[0][BAD]);
      text("Bad",200,300);
      fill(JUDGMENT_COLORS[0][MISS]);
      text("Miss",200,325);
      
      fill("blue");
      text("Early",200,350);
      fill("red");
      text("Late",200,375);
      
      fill(255);
      text(counts[0],300,225);
      text(counts[1],300,250);
      text(counts[2],300,275);
      text(counts[3],300,300);
      text(counts[4],300,325);
      text(nEarly,300,350);
      text(nLate,300,375);
      
      // show a grade that based on the play's accuracy
      textSize(160);
      if (accuracy < 70) {
        fill("red");
        text("D",500,320);
      } else if (accuracy < 80) {
        fill("purple");
        text("C",500,320);
      } else if (accuracy < 90) {
        fill("blue");
        text("B",500,320);
      } else if (accuracy < 95) {
        fill("green");
        text("A",500,320);
      } else if (accuracy < 100) {
        fill("yellow");
        text("S",500,320);
      } else {
        fill("yellow");
        text("SS",500,320);
      }

      // display "retry" and "continue" button
      fill(255);
      textAlign(CENTER,CENTER);
      textSize(32);
      text("Retry",100,470);
      text("Continue",700,470);
      break;
    case EXIT:
      background(THEME_COLOR);
      noStroke();
      textAlign(CENTER,CENTER);
      textSize(48);
      fill(255);
      text("Thank you for playing!",400,250);
      noLoop();
      break;
  }
}

function mousePressed() {
  if (mouseButton == LEFT) {    
    if (clickSound.isLoaded() && page != EXIT && mouseX >= 0 && mouseX <= 800 && mouseY >= 0 && mouseY <= 500) {
      clickSound.play();
    }
    switch (page) {
      case MENU:
        if (mouseX >= 0 && mouseX <= 800) {        
          if (mouseY >= 225 && mouseY <= 425) {
            if (mouseY < 325) {
              if (mouseY < 275) {
                page = SONG_SELECT;
                newSongSelected();
              } else {
                page = SETTING;
                selectedKey = -1;
              }
            } else {
              if (mouseY < 375) {
                page = TUTORIAL;
              } else {
                page = EXIT;
              }
            }
          }
        }
        break;
      case SONG_SELECT:
        if (mouseY >= 190 && mouseY <= 310) {
          if (mouseX >= 0 && mouseX <= 80) {
            // if the mouse clicked on the left arrow
            currentSong.audio.stop();
            --selectedIndex;
            if (selectedIndex < 0) {
              selectedIndex += nSong;
            }
            newSongSelected();
          } else if (mouseX >= 720 && mouseX <= 800) {
            // if the mouse clicked on the right arrow
            currentSong.audio.stop();
            ++selectedIndex;
            if (selectedIndex == nSong) {
              selectedIndex -= nSong;
            }
            newSongSelected();
          }
        }
        if (mouseY >= 440 && mouseY <= 500 && mouseX >= 0 && mouseX <= 200) {
          // if the mouse clicked on the "back" button
          currentSong.audio.stop();
          page = MENU;
        }
        if (mouseX >= 300 && mouseX <= 500 && mouseY >= 410 && mouseY <= 470) {
          // if the mouse clicked on the "start" button
          currentSong.audio.stop();
          page = GAME;
          gameInit();
          wait = true;
          waitStart = Date.now();
        }
        break;
      case SETTING:
        if (mouseY >= 75 && mouseY <= 125) {
          if (mouseX >= 325 && mouseX <= 375) {
            // if the mouse clicked on the decrease speed button
            noteSpeed = max(1,noteSpeed-1);
          } else if (mouseX >= 425 && mouseX <= 475) {
            // if the mouse clicked on the increase speed button
            ++noteSpeed;
          }
        } else if (mouseY >= 175 && mouseY <= 225) {
          if (mouseX >= 325 && mouseX <= 375) {
            // if the mouse clicked on the decrease offset button
            if (changeByTen) {
              customOffset -= 10;
            } else {
              --customOffset;
            }
          } else if (mouseX >= 425 && mouseX <= 475) {
            // if the mouse clicked on the increase offset button
            if (changeByTen) {
              customOffset += 10;
            } else {
              ++customOffset;
            }
          }
        }
        if (mouseY >= 440 && mouseY <= 500 && mouseX >= 0 && mouseX <= 200) {
          // if the mouse clicked on the "back" button
          page = MENU;
        }
        if (mouseX >= 300 && mouseX < 500 && mouseY >= 300 && mouseY <= 350) {
          // if the mouse clicked on one of the four keys under "key bindings"
          selectedKey = floor((mouseX-300)/50);
        } else {
          selectedKey = -1;
        }
        break;
      case TUTORIAL:
        if (mouseY >= 440 && mouseY <= 500) {
          if (mouseX >= 0 && mouseX <= 200) {
            // if the mouse clicked on the left button
            if (tutorialPage == 0) {
              page = MENU;
            } else {
              --tutorialPage;
            }
          } else if (mouseX >= 600 && mouseX <= 800) {
            // if the mouse clicked on the right button
            if (tutorialPage == 21) {
              page = MENU;
            } else {
              ++tutorialPage;
            }
          }
        }
        break;
      case RESULT:
        if (mouseY >= 440 && mouseY <= 500) {
          if (mouseX >= 0 && mouseX <= 200) {
            // if the mouse clicked on the "retry" button
            page = GAME;
            gameInit();
            wait = true;
            waitStart = Date.now();
          } else if (mouseX >= 600 && mouseX <= 800) {
            // if the mouse clicked on the "continue" button
            page = SONG_SELECT;
            newSongSelected();
          }
        }
        break;
    }
  }
}

function keyTyped() {
  switch (page) {
    case SETTING:
      if (selectedKey != -1) {
        keys[selectedKey] = key;
        selectedKey = -1;
      }
      break;
    case GAME:
      for (i = 0; i < 4; ++i) {
        if (key == keys[i]) {
          keysPressed[i] = true;
          pressedJudge(i);
          break;
        }
      }
      break;
  }
}

function keyPressed() {
  switch (page) {
    case SONG_SELECT:
      if (keyCode == ESCAPE) {
        currentSong.audio.stop();
        page = MENU;
      } else if (keyCode == ENTER) {
        currentSong.audio.stop();
        page = GAME;
        gameInit();
        wait = true;
        waitStart = Date.now();
      } else if (keyCode == LEFT_ARROW) {
        currentSong.audio.stop();
        --selectedIndex;
        if (selectedIndex < 0) {
          selectedIndex += nSong;
        }
        newSongSelected();
      } else if (keyCode == RIGHT_ARROW) {
        currentSong.audio.stop();
        ++selectedIndex;
        if (selectedIndex == nSong) {
          selectedIndex -= nSong;
        }
        newSongSelected();
      }
      break;
    case SETTING:
      if (keyCode == ESCAPE) {
        page = MENU;
      } else if (keyCode == SHIFT) {
        changeByTen = true;
      }
      break;
    case TUTORIAL:
      if (keyCode == ESCAPE) {
        page = MENU;
      } else if (keyCode == LEFT_ARROW) {
        if (tutorialPage != 0) {
          --tutorialPage;
        }
      } else if (keyCode == RIGHT_ARROW) {
        if (tutorialPage != 21) {
          ++tutorialPage;
        }
      }
      break;
    case GAME:
      if (keyCode == ESCAPE) {
        page = PAUSE;
        songStopTime = Date.now() - songStartTime;
        currentSong.audio.pause();
      }
      break;
    case PAUSE:
      if (keyCode == ESCAPE) {
        page = GAME;
        currentSong.audio.play();
        songStartTime += Date.now() - songStartTime - songStopTime;
      }
      break;
    case RESULT:
      if (keyCode == ESCAPE) {
        page = SONG_SELECT;
        newSongSelected();
      }
      break;
  }
}

function keyReleased() {
  switch (page) {
    case SETTING:
      if (keyCode == SHIFT) {
        changeByTen = false;
      }
      break;
    case GAME:
      for (i = 0; i < 4; ++i) {
        if (key == keys[i]) {
          keysPressed[i] = false;
          releasedJudge(i);
          break;
        }
      }
      break;
  }
}