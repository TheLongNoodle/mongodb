import Joi from "joi";
import { MongoClient } from "mongodb";
import express from "express";

let playerCollection;
let teamCollection;
let app;

try {
    // MongoDB init
    const uri = "mongodb://127.0.0.1:27017/";
    const dbName = "footballDB";
    const playerCollectionName = "players";
    const teamCollectionName = "teams";
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Successfully connected to the MongoDB server");
    const db = client.db(dbName);
    playerCollection = db.collection(playerCollectionName);
    teamCollection = db.collection(teamCollectionName);
    await playerCollection.createIndexes([
        {
            key: { team: 1, number: 1 },
            unique: true,
            sparse: true,
        },
    ]);
    await teamCollection.createIndexes([
        {
            key: { name: 1 },
            unique: true,
        },
    ]);

    // Express app init
    const PORT = 3000;
    app = express();
    app.use(express.json());
    app.set("view engine", "ejs");
    app.listen(PORT, () => {
        console.log(`Example app listening at http://localhost:${PORT}`);
    });
} catch (e) {
    console.error(e);
}

// Joi schemes
const playerSchema = Joi.object({
    fname: Joi.string().required(),
    lname: Joi.string().required(),
    nationality: Joi.string(),
    number: Joi.number().when("team", {
        is: Joi.string().min(1).required(),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
    cost: Joi.number(),
    team: Joi.string(),
});

const teamSchema = Joi.object({
    name: Joi.string(),
    budget: Joi.number(),
});

// API endpoints

// Add team (1)
app.post("/team", async (req, res) => {
    console.log(`request at POST /team\nbody: ${JSON.stringify(req.body)}`);
    if (req.body) {
        try {
            const team = await teamSchema.validateAsync(req.body, { abortEarly: false });
            await teamCollection.insertOne(team);
            res.status(201).json({
                status: "success",
                message: `Team added successfully!`,
            });
            console.log(`Team added successfully!`);
        } catch (error) {
            res.status(400).json({
                status: "failure",
                message: error.details ? error.details.map((d) => d.message) : error.message,
            });
            console.log(`Error: ${error}`);
        }
    } else {
        res.status(400).json({ status: "failure", message: `Missing body` });
        console.log(`Request is missin a body`);
    }
});

// Add player (2)
app.post("/player", async (req, res) => {
    console.log(`request at POST /player\nbody: ${JSON.stringify(req.body)}`);
    if (req.body) {
        try {
            const player = await playerSchema.validateAsync(req.body, { abortEarly: false });
            if ("team" in player) {
                const team = await teamCollection.findOne({ name: player.team });
                if (!team) throw new Error("Team not found");
                const teamStats = await playerCollection
                    .aggregate([
                        { $match: { team: team._id } },
                        {
                            $group: {
                                _id: "$team",
                                count: { $sum: 1 },
                                totalCost: { $sum: { $ifNull: ["$cost", 0] } },
                            },
                        },
                    ])
                    .toArray();
                const stats = teamStats[0] || { count: 0, totalCost: 0 };
                if (stats.count >= 5) {
                    throw new Error("Team can't have more then 5 players");
                }
                const newPlayerCost = player.cost || 0;
                if (stats.totalCost + newPlayerCost > team.budget) {
                    throw new Error("Not enough budget");
                }
                player.team = team._id;
            }
            await playerCollection.insertOne(player);
            res.status(201).json({
                status: "success",
                message: `Player added successfully!`,
            });
            console.log(`Player added successfully!`);
        } catch (error) {
            res.status(400).json({
                status: "failure",
                message: error.details ? error.details.map((d) => d.message) : error.message,
            });
            console.log(`Error: ${error}`);
        }
    } else {
        res.status(400).json({ status: "failure", message: `Missing body` });
        console.log(`Request is missin a body`);
    }
});

// add team (3, 8)
app.put("/team/:team/player/:player/:num", async (req, res) => {
    console.log(`request at PUT /team/${req.params.team}/player/${req.params.player}`);
    try {
        const team = await teamCollection.findOne({ name: req.params.team });
        if (!team) throw new Error("Team not found");
        const players = await playerCollection
            .aggregate([
                {
                    $addFields: {
                        fullName: {
                            $concat: [{ $ifNull: ["$fname", ""] }, " ", { $ifNull: ["$lname", ""] }],
                        },
                    },
                },
                {
                    $match: {
                        fullName: { $regex: req.params.player, $options: "i" },
                    },
                },
            ])
            .toArray();
        if (players.length === 0) throw new Error("Player not found");
        const player = players[0];
        await playerCollection.updateOne(
            { _id: player._id },
            { $set: { team: team._id, number: parseInt(req.params.num, 10) } }
        );

        res.status(200).json({
            status: "success",
            message: `Player updated with team successfully!`,
        });
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Get brazillian teams (7)
app.get("/team/top-brazilian", async (req, res) => {
    console.log(`request at GET /teams/top-brazilian`);
    try {
        const topTeams = await playerCollection
            .aggregate([
                {
                    $match: {
                        nationality: { $regex: /^Brazil$/i },
                    },
                },
                {
                    $group: {
                        _id: "$team",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $limit: 3,
                },
                {
                    $lookup: {
                        from: "teams",
                        localField: "_id",
                        foreignField: "_id",
                        as: "team",
                    },
                },
                {
                    $unwind: "$team",
                },
                {
                    $project: {
                        _id: 0,
                        teamName: "$team.name",
                        BrazillianCount: "$count",
                    },
                },
            ])
            .toArray();

        res.status(200).json(topTeams);
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Get team players (4)
app.get("/team/:name", async (req, res) => {
    console.log(`request at GET /team/${req.params.name}`);
    try {
        const team = await teamCollection.findOne({ name: req.params.name });
        if (!team) throw new Error("Team not found");
        else {
            const out = await playerCollection.find({ team: team._id }).toArray();
            res.send(out);
        }
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Search player (5)
app.get("/player/:name", async (req, res) => {
    console.log(`request at GET /player/${req.params.name}`);
    try {
        const out = await playerCollection
            .aggregate([
                {
                    $addFields: {
                        fullName: {
                            $concat: [{ $ifNull: ["$fname", ""] }, " ", { $ifNull: ["$lname", ""] }],
                        },
                    },
                },
                {
                    $match: {
                        fullName: { $regex: req.params.name, $options: "i" },
                    },
                },
            ])
            .toArray();
        res.send(out);
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Get team players numbers (6)
app.get("/team/:name/number/:num", async (req, res) => {
    console.log(`request at GET /team/${req.params.name}/number/${req.params.num}`);
    try {
        const team = await teamCollection.findOne({ name: req.params.name });
        if (!team) throw new Error("Team not found");
        else {
            const out = await playerCollection
                .find({ team: team._id, number: { $gte: parseInt(req.params.num, 10) } })
                .toArray();
            res.send(out);
        }
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Delete player (9)
app.delete("/player/:name", async (req, res) => {
    console.log(`request at GET /team/${req.params.name}/number/${req.params.num}`);
    try {
        const players = await playerCollection
            .aggregate([
                {
                    $addFields: {
                        fullName: {
                            $concat: [{ $ifNull: ["$fname", ""] }, " ", { $ifNull: ["$lname", ""] }],
                        },
                    },
                },
                {
                    $match: {
                        fullName: { $regex: req.params.name, $options: "i" },
                    },
                },
                {
                    $project: { _id: 1 },
                },
            ])
            .toArray();
        if (players.length > 0) {
            await playerCollection.deleteOne({ _id: players[0]._id });
        } else throw new Error("Team not found");
        res.status(201).json({
            status: "success",
            message: `Team added successfully!`,
        });
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Delete team (10)
app.delete("/team/:name", async (req, res) => {
    console.log(`request at GET /team/${req.params.name}`);
    try {
        const team = await teamCollection.findOne({ name: req.params.name });
        if (!team) throw new Error("Team not found");
        else {
            await teamCollection.deleteOne({ name: req.params.name });
            res.status(201).json({
                status: "success",
                message: `Team added successfully!`,
            });
        }
    } catch (error) {
        res.status(400).json({
            status: "failure",
            message: error.details ? error.details.map((d) => d.message) : error.message,
        });
        console.log(`Error: ${error}`);
    }
});

// Default endpoint
app.all("*any", (req, res) => {
    res.status(404).json({
        status: "fail",
        message: `Cannot find ${req.method} on endpoint ${req.originalUrl}`,
    });
});
