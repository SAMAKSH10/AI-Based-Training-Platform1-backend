const Resume = require('../models/Resume');


exports.createResume = async (req, res) => {
    try {
        const { name, email, resumeData, uid } = req.body;

        // Validate required fields
        if (!name || !email || !uid || !resumeData) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, UID, and resume data are required'
            });
        }

        // Create new resume document
        const newResume = new Resume({
            name,
            email,
            uid,
            resumeData
        });

        await newResume.save();

        res.status(201).json({
            success: true,
            message: 'Resume data uploaded successfully',
            data: newResume
        });

    } catch (error) {
        console.error('Error saving resume data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save resume data',
            error: error.message
        });
    }
};

exports.getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ uid: req.params.uid });
        
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'No resume found for this user'
            });
        }

        res.status(200).json({
            success: true,
            data: resume
        });

    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

exports.uploadResume = async (req, res) => {
    try {
        const { userName, resumeBlob } = req.body;

        if (!userName || !resumeBlob) {
            return res.status(400).json({
                success: false,
                message: 'Username and resume file are required'
            });
        }

        // Upload file using utility function
        const filePath = await uploadResumeFile(userName, resumeBlob);

        res.status(200).json({
            success: true,
            message: 'Resume file uploaded successfully',
            filePath
        });

    } catch (error) {
        console.error('Error uploading resume file:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading resume file',
            error: error.message
        });
    }
};