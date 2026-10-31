
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// SUBMIT HIGH SCORE
router.post("/score", verifyToken, async (req, res) => {
    try {
        const score = Number(req.body.score);
        const userId = req.user.id;

        if (
            !Number.isSafeInteger(score) ||
            score < 0 ||
            score > 2147483647
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid score"
            });
        }

        await db.query(
            `UPDATE users
             SET high_score = GREATEST(high_score, ?)
             WHERE id = ?`,
            [score, userId]
        );

        const [rows] = await db.query(
            "SELECT high_score FROM users WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Score submitted successfully",
            high_score: rows[0].high_score
        });

    } catch (error) {
        console.error("Score error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not update score"
        });
    }
});

// GET PLAYER PROFILE AND HIGH SCORE
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, email, high_score
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: rows[0]
        });

    } catch (error) {
        console.error("Profile error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not fetch profile"
        });
    }
});

// GET PUBLIC LEADERBOARD
router.get("/leaderboard", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT name, high_score
             FROM users
             WHERE high_score IS NOT NULL
             ORDER BY high_score DESC, name ASC
             LIMIT 10`
        );

        res.json({
            success: true,
            leaderboard: rows
        });

    } catch (error) {
        console.error("Leaderboard error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not fetch leaderboard"
        });
    }
});
module.exports = router;
