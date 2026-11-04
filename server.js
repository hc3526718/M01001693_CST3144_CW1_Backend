/* SERVER CODE: index.js */
// import dependencies
// import express from "express";
var express = require("express");
var cors = require("cors");
var app = express();
var path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

const client = new MongoClient(MONGODB_URI);
const db = client.db("lessonDB");


app.use(cors());

app.use(express.json());

app.get("/", function (request, response) {
    response.send("Welcome to the CourseApp backend server!");
});

// Serve lesson images from the frontend images folder
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(function (request, response, next) {
    console.log("Incoming " + request.method + " request to: " + request.url);
    next();
});

// Return an error if the requested image does not exist
app.use("/images", function (request, response, next) {
    response.status(404).send("Error: Lesson image not found.");
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

app.get("/lessons", async function (request, response) {
    try {
        const lessonsCollection = db.collection("lessons");

        const lessons = await lessonsCollection.find({}).toArray();

        console.log("Lessons retrieved:", lessons.length);

        response.status(200).json(lessons);

    } catch (error) {
        console.error("Error retrieving lessons from MongoDB:", error);

        response.status(500).json({
            error: "Failed to retrieve lessons"
        });
    }
});

app.post("/order", async function (request, response) {
    try {
        const order = request.body;
        if (!order || !order.name || !order.phone || !order.address || !Array.isArray(order.lessonIDs) || order.lessonIDs.length === 0) {
            return response.status(400).json({ error: "Invalid order" });
        }
        console.log("New order received:");
        console.log("Name: " + order.name);
        console.log("Phone: " + order.phone);
        console.log("Address: " + order.address);
        console.log("Lesson IDs:", JSON.stringify(order.lessonIDs));
        order.lessonIDs.forEach(function (entry, index) {
            console.log("[" + index + "] Lesson ID: " + entry[0] + ", Spaces: " + entry[1]);
        });

        const result = await db.collection("orders").insertOne({
            name: order.name,
            phone: order.phone,
            address: order.address,
            lessonIDs: order.lessonIDs,
            createdAt: new Date()
        });

        response.status(201).json({
            message: "Order saved successfully",
            orderId: result.insertedId
        });
    } catch (error) {
        console.error("Error processing order:", error);
        response.status(500).json({
            error: "Failed to process order"
        });
    }
});

app.put("/lessons/:id", async function (request, response) {
    try {
        const lessonId = Number(request.params.id);
        const quantity = Number(request.body.quantity);
        if (!Number.isInteger(lessonId) || !Number.isInteger(quantity) || quantity < 1) {
            return response.status(400).json({ error: "Invalid lesson ID or quantity" });
        }

        const lessonsCollection = db.collection("lessons");
        const lesson = await lessonsCollection.findOne({ id: lessonId });
        if (!lesson) {
            return response.status(404).json({ error: "Lesson not found" });
        }

        const field = lesson.space !== undefined ? "space" : "spaces";
        const result = await lessonsCollection.updateOne(
            { id: lessonId, [field]: { $gte: quantity } },
            { $inc: { [field]: -quantity } }
        );
        if (result.modifiedCount === 0) {
            return response.status(409).json({ error: "Not enough spaces available" });
        }

        console.log("Lesson " + lessonId + " spaces reduced by " + quantity);
        response.status(200).json({ message: "Lesson spaces updated" });
    } catch (error) {
        console.error("Error updating lesson:", error);
        response.status(500).json({ error: "Failed to update lesson" });
    }
});

app.use(function (request, response) {
    response.status(404).send("Page not found!");
    console.log("Error 404: Page not found!");
});

async function startServer() {
    try {
        await client.connect();

        console.log("Successfully connected to MongoDB!");

        app.listen(PORT, function () {
            console.log("App started on port " + PORT);
        });

    } catch (error) {
        console.error("Unable to connect to MongoDB:", error);
    }
}

startServer();
