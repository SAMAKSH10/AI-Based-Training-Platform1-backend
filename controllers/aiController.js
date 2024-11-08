import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import gis from "g-i-s";
import youtubesearchapi from "youtube-search-api";
import { YoutubeTranscript } from "youtube-transcript";
import nodemailer from "nodemailer";
import showdown from "showdown";
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Define safety settings
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

export const handlePrompt = async (req, res) => {
    // console.log('Received request body:', req.body); // Add logging
    const { prompt, useUserApiKey, userApiKey } = req.body;

    try {
        let model;
        if (useUserApiKey && userApiKey) {
            console.log('Using user API key'); // Add logging
            const genAIuser = new GoogleGenerativeAI(userApiKey);
            model = genAIuser.getGenerativeModel({ model: "gemini-pro", safetySettings });
        } else {
            console.log('Using default API key'); // Add logging
            model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        }

        console.log('Generating content for prompt:', prompt); // Add logging
        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();
        console.log('Generated response:', generatedText); // Add logging
        res.status(200).json({ generatedText });
    } catch (error) {
        console.error("Error in handlePrompt:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: error.message // Include error message for debugging
        });
    }
};

export const generateContent = async (req, res) => {
    const { prompt, useUserApiKey, userApiKey } = req.body;

    try {
        let model;
        if (useUserApiKey && userApiKey) {
            const genAIuser = new GoogleGenerativeAI(userApiKey);
            model = genAIuser.getGenerativeModel({ model: "gemini-pro", safetySettings });
        } else {
            model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        }

        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();
        const converter = new showdown.Converter();
        const htmlContent = converter.makeHtml(generatedText);
        res.status(200).json({ text: htmlContent });
    } catch (error) {
        console.error("Error in generateContent:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const handleChat = async (req, res) => {
    const { prompt } = req.body;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            safetySettings,
        });

        const result = await model.generateContent(prompt);
        const txt = result.response.text();
        const converter = new showdown.Converter();
        const text = converter.makeHtml(txt);
        res.status(200).json({ text });
    } catch (error) {
        console.error("Error in handleChat:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getProjectSuggestions = async (req, res) => {
    const { prompt } = req.body;

    try {
        // This is a placeholder. You'll need to implement or integrate with an actual AI service for project suggestions
        const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        const result = await model.generateContent(`Generate project suggestions based on: ${prompt}`);
        const suggestions = result.response.text().split('\n').filter(suggestion => suggestion.trim() !== '');
        res.json({ suggestions });
    } catch (error) {
        console.error("Error generating project suggestions:", error);
        res.status(500).send("Error generating project suggestions");
    }
};

export const getImage = async (req, res) => {
    const { prompt } = req.body;

    try {
        gis(prompt, (error, results) => {
            if (error || !results || results.length === 0) {
                const defaultImageUrl = "https://via.placeholder.com/150";
                res.status(200).json({ url: defaultImageUrl });
            } else {
                res.status(200).json({ url: results[0].url });
            }
        });
    } catch (error) {
        console.error("Error in getImage:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getYouTubeVideo = async (req, res) => {
    const { prompt } = req.body;

    try {
        const video = await youtubesearchapi.GetListByKeyword(prompt, [false], [1], [{ type: "video" }]);
        const videoId = video.items[0].id;
        res.status(200).json({ url: videoId });
    } catch (error) {
        console.error("Error in getYouTubeVideo:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getYouTubeTranscript = async (req, res) => {
    const { prompt } = req.body;

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(prompt);
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transcript is disabled or not available for this video.",
            });
        }
        res.status(200).json({ url: transcript });
    } catch (error) {
        if (error.message.includes("Transcript is disabled")) {
            return res.status(403).json({
                success: false,
                message: "Transcript is disabled on this video.",
            });
        }
        console.error("Error in getYouTubeTranscript:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const sendEmail = async (req, res) => {
    const { html, to, subject } = req.body;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        service: "gmail",
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        res.status(200).json(info);
    } catch (error) {
        console.error("Error in sendEmail:", error);
        res.status(400).json(error);
    }
};