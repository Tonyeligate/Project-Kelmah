const express = require('express');
const router = express.Router();
const Database = require('../config/database');
const { auth } = require('../middleware/auth');
const { LoggerService } = require('../services/LoggerService');

const logger = new LoggerService();

// Get all events for a user
router.get('/', auth, async (req, res) => {
    try {
        const db = await Database.getInstance();
        const userId = req.user.id;
        const userRole = req.user.role;

        const events = await db.all(`
            SELECT 
                e.id,
                e.title,
                e.description,
                e.start_time as startTime,
                e.end_time as endTime,
                e.type,
                e.status,
                e.location,
                e.created_at as createdAt,
                CASE 
                    WHEN e.type = 'interview' THEN j.title 
                    ELSE NULL 
                END as jobTitle
            FROM events e
            LEFT JOIN jobs j ON e.job_id = j.id
            WHERE (e.client_id = ? OR e.worker_id = ?)
            AND e.start_time >= datetime('now', '-1 day')
            ORDER BY e.start_time ASC`,
            [userId, userId]
        );

        res.json({ events });
    } catch (error) {
        logger.error('Error fetching events:', error);
        res.status(500).json({ 
            message: 'Error fetching events',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create new event
router.post('/', auth, async (req, res) => {
    try {
        const db = await Database.getInstance();
        const userId = req.user.id;
        const {
            title,
            description,
            startTime,
            endTime,
            type,
            location,
            jobId
        } = req.body;

        const result = await db.run(`
            INSERT INTO events (
                title,
                description,
                start_time,
                end_time,
                type,
                status,
                location,
                client_id,
                job_id,
                created_at
            ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, datetime('now'))`,
            [title, description, startTime, endTime, type, location, userId, jobId]
        );

        const newEvent = await db.get(
            'SELECT * FROM events WHERE id = ?',
            [result.lastID]
        );

        res.status(201).json({ event: newEvent });
    } catch (error) {
        logger.error('Error creating event:', error);
        res.status(500).json({ 
            message: 'Error creating event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update event
router.put('/:id', auth, async (req, res) => {
    try {
        const db = await Database.getInstance();
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        // Verify event ownership
        const event = await db.get(
            'SELECT * FROM events WHERE id = ? AND (client_id = ? OR worker_id = ?)',
            [id, userId, userId]
        );

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const updateFields = Object.keys(updates)
            .map(key => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`)
            .join(', ');

        await db.run(
            `UPDATE events SET ${updateFields} WHERE id = ?`,
            [...Object.values(updates), id]
        );

        const updatedEvent = await db.get('SELECT * FROM events WHERE id = ?', [id]);
        res.json({ event: updatedEvent });
    } catch (error) {
        logger.error('Error updating event:', error);
        res.status(500).json({ 
            message: 'Error updating event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
    try {
        const db = await Database.getInstance();
        const { id } = req.params;
        const userId = req.user.id;

        // Verify event ownership
        const event = await db.get(
            'SELECT * FROM events WHERE id = ? AND (client_id = ? OR worker_id = ?)',
            [id, userId, userId]
        );

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await db.run('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        logger.error('Error deleting event:', error);
        res.status(500).json({ 
            message: 'Error deleting event',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 