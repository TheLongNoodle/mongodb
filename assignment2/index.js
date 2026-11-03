import mongoose from "mongoose";
const { Schema, model } = mongoose;
import express from "express";

// Mongoose schemes
const playerSchema = new mongoose.Schema({
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    nationality: { type: String },
    number: {
        type: Number,
        required: function () {
            return this.team && this.team.trim().length > 0;
        },
        validate: {
            validator: function (v) {
                const hasTeam = this.team && this.team.trim().length > 0;
                if (!hasTeam) {
                    return v === undefined || v === null;
                }
                return v !== undefined && v !== null;
            },
            message: "Number is required when a team is specified, and forbidden otherwise.",
        },
    },

    cost: { type: Number },
    team: { type: String },
});

const teamSchema = new mongoose.Schema({
    name: { type: String },
    budget: { type: Number },
});

const Team = model("Team", teamSchema);
const Player = model("Player", playerSchema);
let app;

try {
    // MongoDB init
    const uri = "mongodb://127.0.0.1:27017/footballDB";
    await mongoose.connect(uri);
    console.log("Successfully connected to the MongoDB server via Mongoose");
    await Player.collection.createIndexes([
        {
            key: { team: 1, number: 1 },
            unique: true,
            sparse: true,
        },
    ]);
    await Team.collection.createIndexes([
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

// API endpoints

// Add team (1)
app.post("/team", async (req, res) => {
    console.log(`request at POST /team\nbody: ${JSON.stringify(req.body)}`);
    if (req.body) {
        try {
            await new Team(req.body).save();
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
            const player = new Player(req.body);
            if (player.team) {
                const team = await Team.findOne({ name: player.team });
                if (!team) throw new Error("Team not found");
                const teamStats = await Player.aggregate([
                    { $match: { team: team._id } },
                    {
                        $group: {
                            _id: "$team",
                            count: { $sum: 1 },
                            totalCost: { $sum: { $ifNull: ["$cost", 0] } },
                        },
                    },
                ]);
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
            await Player.insertOne(player);
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
        const team = await Team.findOne({ name: req.params.team });
        if (!team) throw new Error("Team not found");
        const players = await Player.aggregate([
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
        ]);
        if (players.length === 0) throw new Error("Player not found");
        const player = players[0];
        await Player.updateOne({ _id: player._id }, { $set: { team: team._id, number: parseInt(req.params.num, 10) } });

        res.status(201).json({
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
        const topTeams = await Player.aggregate([
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
        ]);

        res.status(201).json(topTeams);
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
        const team = await Team.findOne({ name: req.params.name });
        if (!team) throw new Error("Team not found");
        else {
            const out = await Player.find({ team: team._id });
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
        const out = await Player.aggregate([
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
        ]);
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
        const team = await Team.findOne({ name: req.params.name });
        if (!team) throw new Error("Team not found");
        else {
            const out = await Player.find({ team: team._id, number: { $gte: parseInt(req.params.num, 10) } });
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
    console.log(`request at DELETE player/${req.params.name}`);
    try {
        const players = await Player.aggregate([
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
        ]);
        if (players.length > 0) {
            await Player.deleteOne({ _id: players[0]._id });
        } else throw new Error("Player not found");
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
    console.log(`request at DELETE /team/${req.params.name}`);
    try {
        const team = await Team.findOne({ name: req.params.name });
        if (!team) throw new Error("Team not found");
        else {
            await Team.deleteOne({ name: req.params.name });
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
