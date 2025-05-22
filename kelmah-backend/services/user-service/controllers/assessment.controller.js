const { Worker, Assessment, AssessmentResult, Question, Option } = require('../models');
const { Op } = require('sequelize');

// Sample questions for each category
const questions = {
    technical: [
        {
            text: 'What is the primary purpose of version control systems like Git?',
            options: [
                { text: 'To store code in the cloud', isCorrect: false },
                { text: 'To track changes and collaborate on code', isCorrect: true },
                { text: 'To compile code', isCorrect: false },
                { text: 'To debug code', isCorrect: false }
            ]
        },
        {
            text: 'Which of the following is NOT a programming paradigm?',
            options: [
                { text: 'Object-Oriented Programming', isCorrect: false },
                { text: 'Functional Programming', isCorrect: false },
                { text: 'Cooking', isCorrect: true },
                { text: 'Procedural Programming', isCorrect: false }
            ]
        }
    ],
    soft: [
        {
            text: 'How would you handle a situation where a client is dissatisfied with your work?',
            options: [
                { text: 'Ignore their feedback', isCorrect: false },
                { text: 'Listen actively and propose solutions', isCorrect: true },
                { text: 'Defend your work without listening', isCorrect: false },
                { text: 'Quit the project', isCorrect: false }
            ]
        },
        {
            text: 'What is the most important aspect of team communication?',
            options: [
                { text: 'Speaking the most', isCorrect: false },
                { text: 'Active listening and clear expression', isCorrect: true },
                { text: 'Using technical jargon', isCorrect: false },
                { text: 'Writing long emails', isCorrect: false }
            ]
        }
    ],
    language: [
        {
            text: 'Which sentence is grammatically correct?',
            options: [
                { text: 'I have completed the task yesterday', isCorrect: false },
                { text: 'I completed the task yesterday', isCorrect: true },
                { text: 'I am completed the task yesterday', isCorrect: false },
                { text: 'I had completed the task yesterday', isCorrect: false }
            ]
        },
        {
            text: 'What is the correct way to write a professional email greeting?',
            options: [
                { text: 'Hey there!', isCorrect: false },
                { text: 'Dear [Name],', isCorrect: true },
                { text: 'Hi!', isCorrect: false },
                { text: 'Yo!', isCorrect: false }
            ]
        }
    ]
};

const assessmentController = {
    // Get all assessments for a worker
    getAssessments: async (req, res) => {
        try {
            const workerId = req.user.id;

            // Get all assessment results for the worker
            const results = await AssessmentResult.findAll({
                where: { workerId },
                order: [['createdAt', 'DESC']]
            });

            // Format the response
            const assessments = Object.keys(questions).map(category => {
                const result = results.find(r => r.category === category);
                const lastTaken = result?.createdAt;
                const canRetake = !lastTaken || 
                    (new Date() - new Date(lastTaken)) > 24 * 60 * 60 * 1000; // 24 hours

                return {
                    category,
                    score: result?.score || 0,
                    lastTaken,
                    canRetake
                };
            });

            res.json({
                success: true,
                data: assessments
            });
        } catch (error) {
            console.error('Error fetching assessments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch assessments'
            });
        }
    },

    // Start a new assessment
    startAssessment: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { category } = req.body;

            // Validate category
            if (!questions[category]) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid assessment category'
                });
            }

            // Check if worker can take the test
            const lastResult = await AssessmentResult.findOne({
                where: {
                    workerId,
                    category
                },
                order: [['createdAt', 'DESC']]
            });

            if (lastResult) {
                const timeSinceLastTest = new Date() - new Date(lastResult.createdAt);
                if (timeSinceLastTest < 24 * 60 * 60 * 1000) {
                    return res.status(400).json({
                        success: false,
                        error: 'You must wait 24 hours before retaking this assessment'
                    });
                }
            }

            // Create assessment record
            const assessment = await Assessment.create({
                workerId,
                category,
                status: 'in_progress',
                timeLimit: 1800 // 30 minutes in seconds
            });

            // Get questions for the category
            const categoryQuestions = questions[category];

            res.json({
                success: true,
                data: {
                    id: assessment.id,
                    category,
                    timeLimit: assessment.timeLimit,
                    questions: categoryQuestions.map(q => ({
                        id: q.text, // Using text as ID for simplicity
                        text: q.text,
                        options: q.options.map((opt, index) => ({
                            id: index.toString(),
                            text: opt.text
                        }))
                    }))
                }
            });
        } catch (error) {
            console.error('Error starting assessment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to start assessment'
            });
        }
    },

    // Submit assessment answers
    submitAssessment: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { testId, answers } = req.body;

            // Get assessment
            const assessment = await Assessment.findOne({
                where: {
                    id: testId,
                    workerId,
                    status: 'in_progress'
                }
            });

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    error: 'Assessment not found or already completed'
                });
            }

            // Calculate score
            const categoryQuestions = questions[assessment.category];
            let correctAnswers = 0;

            Object.entries(answers).forEach(([questionId, answerId]) => {
                const question = categoryQuestions.find(q => q.text === questionId);
                if (question && question.options[parseInt(answerId)].isCorrect) {
                    correctAnswers++;
                }
            });

            const score = Math.round((correctAnswers / categoryQuestions.length) * 100);

            // Create assessment result
            const result = await AssessmentResult.create({
                workerId,
                assessmentId: assessment.id,
                category: assessment.category,
                score,
                answers
            });

            // Update assessment status
            await assessment.update({ status: 'completed' });

            // Calculate category scores for detailed feedback
            const categoryScores = Object.keys(questions).map(cat => ({
                name: cat.charAt(0).toUpperCase() + cat.slice(1),
                score: cat === assessment.category ? score : 0
            }));

            res.json({
                success: true,
                data: {
                    score,
                    categoryScores
                }
            });
        } catch (error) {
            console.error('Error submitting assessment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit assessment'
            });
        }
    }
};

module.exports = assessmentController; 