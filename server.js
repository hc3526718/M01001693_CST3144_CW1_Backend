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

app.use(function (request, response, next) {
    console.log("Incoming " + request.method + " request to: " + request.url);
    next();
});

app.get("/", function (request, response) {
    response.send("Welcome to the CourseApp backend server!");
});

// __dirname is the folder server.js is in; path.join builds the path correctly on any OS
// a request to /images/tennis.png serves images/tennis.png; if it is missing, the request falls through to the 404 below
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/images", function (request, response, next) {
    response.status(404).send("Error: Lesson image not found.");
});

app.get("/lessons", async function (request, response) {
    try {

        const search = request.query.search; // query strings like ?search= are in request.query, not request.params
        // takes the search string and builds a pipeline of stages to filter and join lessons with teachers based on the user's search input; if no search is provided, the pipeline will just join lessons with teachers without filtering
        const pipeline = [];

        if (search) {
            // a \ character allows for special regex characters to be searched literally;
            //  $& is the matched character, g means every match
            const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // this regex means "any of these characters" and the g means "every match"
            pipeline.push({ // add a filter stage
                $match: {
                    $or: [ // a lesson matches if any one of these four conditions is true
                        { topic: { $regex: pattern, $options: "i" } }, // "i" makes the match case-insensitive
                        { location: { $regex: pattern, $options: "i" } },
                        // $regex only works on strings, so $expr + $toString turn price/spaces into text first
                        { $expr: { $regexMatch: { input: { $toString: "$price" }, regex: pattern, options: "i" } } },
                        { $expr: { $regexMatch: { input: { $toString: "$spaces" }, regex: pattern, options: "i" } } }
                    ]
                }
            });
        }

        pipeline.push({
            $lookup: { // join each lesson with matching teachers
                from: "teachers", // look in the teachers collection
                let: { lessonTopic: "$topic" }, // store this lesson's topic; $ is a field, $$ is a variable
                pipeline: [ // this runs for each lesson, and can use the lesson's topic stored in $$lessonTopic/lessonTopic
                    {
                        $match: { // this stage filters the teachers collection to only those whose lessons array contains this lesson's topic
                            $expr: {
                                $in: ["$$lessonTopic", "$lessons"] // only keep teachers whose lessons array contains this topic
                            }
                        }
                    }
                ],
                as: "teachers" // put the matching teachers into a teachers array on each lesson
            }
        });

        const lessons = await db.collection("lessons").aggregate(pipeline).toArray(); // run the stages in order, then collect the results

        console.log("Lessons retrieved:", lessons.length);
        response.status(200).json(lessons);

    } catch (error) {
        console.error("Error retrieving lessons:", error);
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

        // .every is true only if every entry passes all of these checks
        const validLessons = order.lessonIDs.every(entry =>
            entry && // the entry isn't null or empty
            ObjectId.isValid(entry.lessonID) && // the id is a valid Mongo id format
            typeof entry.lessonName === "string" && // lessonName is text
            entry.lessonName.trim() !== "" && // and not just blank
            Number.isInteger(entry.quantity) && // quantity is a whole number
            entry.quantity > 0 // of at least 1
        );

        if (!validLessons) {
            return response.status(400).json({ error: "Invalid lesson data" });
        }

        const lessonsOrdered = order.lessonIDs.map(function (entry) {
            return [entry.lessonID, entry.lessonName, entry.quantity];
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
        const rawId = request.params.id; // :id from the route path /lessons/:id

        if (!ObjectId.isValid(rawId)) {
            return response.status(400).json({ error: "Invalid lesson ID" });
        }

        const lessonFilter = { _id: new ObjectId(rawId) };
        const updateData = request.body;

        if (!updateData || Object.keys(updateData).length === 0) {
            return response.status(400).json({ error: "No update data provided" });
        }

        const result = await db.collection("lessons").updateOne(
            lessonFilter,
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return response.status(404).json({ error: "Lesson not found" });
        }

        response.status(200).json({ message: "Lesson updated successfully" });

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
        const email = request.params.email; // :email from the route path (e.g. /users/:email)
        if (!email) {
            return response.status(400).json({ error: "Invalid email" });
        }

        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne(
            { email: email }, // find the first user whose email matches
            { projection: { _id: 0, name: 1, phone: 1 } } // 1 includes a field, 0 hides it; _id is included by default unless excluded
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
        const email = request.params.email; // :email from the route path (e.g. /users/:email)
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

app.get("/teachers", async function (request, response) {
    try {
        const teachersCollection = db.collection("teachers");
        const teachers = await teachersCollection.find({}).toArray();

        console.log("Teachers retrieved:", teachers.length);

        response.status(200).json(teachers);
    } catch (error) {
        console.error("Error retrieving teachers from MongoDB:", error);
        response.status(500).json({
            error: "Failed to retrieve teachers"
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
