/* SERVER CODE: index.js */
// import dependencies
// import express from "express";
var express = require("express");
var cors = require("cors");
var app = express();
var path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
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
        const lessonsOrdered = order.lessonIDs.map(function (entry) {
            return [entry[2], entry[1]];
        });
        console.log("Lessons ordered:", JSON.stringify(lessonsOrdered));

        const result = await db.collection("orders").insertOne({
            name: order.name,
            phone: order.phone,
            address: order.address,
            "lessons ordered": lessonsOrdered,
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
        const rawId = request.params.id;
        const lessonFilter = ObjectId.isValid(rawId) && String(new ObjectId(rawId)) === rawId
            ? { _id: new ObjectId(rawId) }
            : { id: Number(rawId) };
        const lessonId = rawId;
        const quantity = Number(request.body.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            return response.status(400).json({ error: "Invalid lesson ID or quantity" });
        }

        const lessonsCollection = db.collection("lessons");
        const lesson = await lessonsCollection.findOne(lessonFilter);
        if (!lesson) {
            return response.status(404).json({ error: "Lesson not found" });
        }

        const field = lesson.space !== undefined ? "space" : "spaces";
        const result = await lessonsCollection.updateOne(
            { ...lessonFilter, [field]: { $gte: quantity } },
            { $inc: { [field]: -quantity } }
        );
        if (result.modifiedCount === 0) {
            return response.status(409).json({ error: "Not enough spaces available" });
        }

        response.status(200).json({ message: "Lesson spaces updated" });
    } catch (error) {
        console.error("Error updating lesson:", error);
        response.status(500).json({ error: "Failed to update lesson" });
    }
});

app.post("/users", async function (request, response) {
    try {
        const user = request.body;
        if (!user || !user.name || !user.email || !user.phone || !user.password) {
            return response.status(400).json({ error: "Invalid user data" });
        }

        const usersCollection = db.collection("users");
        const existingUser = await usersCollection.findOne({ email: user.email });
        if (existingUser) {
            return response.status(409).json({ error: "Email already exists" });
        }

        const result = await usersCollection.insertOne({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            createdAt: new Date()
        });

        response.status(201).json({
            message: "User created successfully",
            userId: result.insertedId
        });
    } catch (error) {
        console.error("Error creating user:", error);
        response.status(500).json({
            error: "Failed to create user"
        });
    }
});

app.get("/users/:email/checkout", async function (request, response) {
    try {
        const email = decodeURIComponent(request.params.email);
        if (!email) {
            return response.status(400).json({ error: "Invalid email" });
        }

        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne(
            { email: email },
            { projection: { _id: 0, name: 1, phone: 1 } }
        );
        if (!user) {
            return response.status(404).json({ error: "User not found" });
        }

        response.status(200).json({
            name: user.name || "",
            phone: user.phone || ""
        });
    } catch (error) {
        console.error("Error retrieving checkout details:", error);
        response.status(500).json({
            error: "Failed to retrieve checkout details"
        });
    }
});

app.get("/users/:email", async function (request, response) {
    try {
        const email = decodeURIComponent(request.params.email);
        if (!email) {
            return response.status(400).json({ error: "Invalid email" });
        }

        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
            return response.status(404).json({ error: "User not found" });
        }

        response.status(200).json(user);
    } catch (error) {
        console.error("Error retrieving user:", error);
        response.status(500).json({
            error: "Failed to retrieve user"
        });
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
