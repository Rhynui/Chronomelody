/**
 * Author      : Isaac Zhou
 * Course Code : ICS2O1-05
 * Date Created: Jun 07, 2022
 * Last Updated: Jun 19, 2022
 * Description : A program that display charts.
 */

var i;
var start = false;
var chartCursors;
var currentSong = SONGS[0];
var currentChart = currentSong.chart;
var startMillis = 1e9;
var lanes = [[], [], [], []];

// states for notes
const NOT_APPROACHED = 0;
const APPROACHED = 1;
const PASSED = 2;

function preload() {
  soundFormats("mp3");
  songAudio = loadSound(currentSong.folder+"/audio");
}

function setup() {
  createCanvas(800, 500);
  for (i = 0; i < currentChart.length; ++i) {
    lanes[currentChart[i][0]].push([currentChart[i][1],currentChart[i][2]]);
  }
}

function drawNote(lane) {
  rect(lane*100+200,300,60,20);
}

function noteState(time,endTime) {
  if (endTime == -1) {
    if (millis()-startMillis >= time) {
      if (millis()-startMillis <= time+100) {
        return APPROACHED;
      } else {
        return PASSED;
      }
    } else {
      return NOT_APPROACHED;
    }
  } else {
    if (millis()-startMillis >= time) {
      if (millis()-startMillis <= endTime) {
        return APPROACHED;
      } else {
        return PASSED;
      }
    } else {
      return NOT_APPROACHED;
    }
  }
}

function draw() {
  background(255);
  text(currentSong.title,100,100);
  text("BPM: "+currentSong.bpm,300,100);
  text("Difficulty: "+currentSong.difficulty,400,100);
  text(currentSong.artist,100,150);
  text(currentSong.creator,300,150);
  line(150,200,150,400);
  line(250,200,250,400);
  line(350,200,350,400);
  line(450,200,450,400);
  line(550,200,550,400);
  rectMode(CENTER);
  if (start) {
    for (i = 0; i < 4; ++i) {
      if (noteState(lanes[i][chartCursors[i]][0],lanes[i][chartCursors[i]][1]) == APPROACHED) {
        drawNote(i);
      } else if (noteState(lanes[i][chartCursors[i]][0],lanes[i][chartCursors[i]][1]) == PASSED) {
        ++chartCursors[i];
      }
    }
  }
}


function mousePressed(){
  if (!start) {
    start = true;
    songAudio.setVolume(0.5);
    songAudio.play();
    chartCursors = [0, 0, 0, 0];
    startMillis = millis();
  } else {
    start = false;
    songAudio.stop();
  }
}