/* SERVER CODE: index.js */
// import dependencies
// import express from "express";
var express = require("express");
var cors = require("cors"); 
var app = express();

app.use(cors()); 

app.use(function (request, response) {
    console.log("In comes a request to: " + request.url);
});

const lessons = [
    {
        id: 1,
        topic: 'Athletics',
        location: 'London',
        price: 25,
        space: 5,
        image: 'athletics.jpg',
        desc: 'Designed to develop core movement skills, this class introduces young athletes to track and field fundamentals such as sprinting, hurdling, relay passing, and field events like shot put. Guided by an instructor, participants improve their speed, agility, and endurance through structured running lanes and interactive physical challenges.'
    },
    {
        id: 2,
        topic: 'Football',
        location: 'Manchester',
        price: 20,
        space: 5,
        image: 'football.jpg',
        desc: 'This energetic session focuses on building foundational soccer skills, including ball control, dribbling, passing, and basic team plays. Under the guidance of a supportive coach, children practice essential footwork and shooting drills while learning key concepts of sportsmanship and teamwork on the pitch.   '
    },
    {
        id: 3,
        topic: 'Basketball',
        location: 'Birmingham',
        price: 30,
        space: 5,
        image: 'basketball.jpg',
        desc: 'In this lively indoor clinic, students learn the fundamentals of basketball, including dribbling, passing, shooting, and positioning. Guided by an encouraging coach, young players engage in skill-building drills and mini-scrimmages that emphasize spatial awareness, hand-eye coordination, and cooperative play.   '
    },
    {
        id: 4,
        topic: 'Tennis',
        location: 'Bristol',
        price: 35,
        space: 5,
        image: 'tennis.jpg',
        desc: 'This introductory racket program teaches students proper grip, forehand and backhand swings, and basic court positioning. Guided by a coach using age-appropriate gear and low-compression balls, children practice rally drills, ball control, and footwork across the net in a fun, structured environment.   '
    },
    {
        id: 5,
        topic: 'Swimming',
        location: 'Leeds',
        price: 28,
        space: 5,
        image: 'swimming.jpg',
        desc: 'This aquatic lesson helps children gain confidence in the water while developing fundamental swimming strokes, breathing techniques, and water safety habits. Guided by an instructor pool-side, swimmers utilize floatation aids, kickboards, and interactive exercises to build endurance and proper kicking mechanics.   '
    },
    {
        id: 6,
        topic: 'Boxing',
        location: 'London',
        price: 40,
        space: 5,
        image: 'boxing.jpg',
        desc: 'Focusing on discipline, rhythm, and cardiovascular fitness, this class introduces non-contact and foundational boxing techniques. Led by a coach, participants learn basic stances, footwork, hand-eye coordination, and controlled striking against heavy bags and target pads while emphasizing safety and self-confidence.   '
    },
    {
        id: 7,
        topic: 'Gymnastics',
        location: 'Nottingham',
        price: 25,
        space: 5,
        image: 'gymnastics.jpg',
        desc: 'This dynamic class develops flexibility, balance, and core strength as young gymnasts explore fundamental apparatuses such as balance beams, low bars, and floor mats. Under careful coaching supervision, students practice body control through handstands, poses, tumbling, and agility exercises.   '
    },
    {
        id: 8,
        topic: 'Rugby',
        location: 'Cardiff',
        price: 30,
        space: 5,
        image: 'rugby.jpg',
        desc: 'An introductory program centered on team dynamics and ball handling, this class teaches the basics of carrying, passing, and catching an oval ball while navigating agility courses. Guided by an instructor, children learn spatial awareness, tag-rugby rules, and cooperative play using soft training gear.   '
    },
    {
        id: 9,
        topic: 'Cycling',
        location: 'Cambridge',
        price: 22,
        space: 5,
        image: 'cycling.jpg',
        desc: 'Focused on balance, coordination, and safety, this beginner class helps young riders master balance bikes and pedal bicycles. Under the direction of a coach, children learn steering, braking, and helmet safety while navigating marked courses and obstacle layouts.   '
    },
    {
        id: 10,
        topic: 'Cricket',
        location: 'Birmingham',
        price: 27,
        space: 5,
        image: 'cricket.jpg',
        desc: 'This class introduces young players to the fundamentals of cricket, including batting technique, bowling actions, and fielding drills. Under the coachs guidance, participants practice hitting targets, catching, and running between wickets using age-appropriate bats, balls, and equipment.'
    }
]

app.get("/lessons", function (request, response) {
    response.json(lessons);
});

app.listen(5500, function () {
    console.log("App started on port 5500");
});


