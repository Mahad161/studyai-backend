const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

module.exports = async (req, res) => {
    // Allow requests from your StudyAI website
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle browser preflight request
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST requests are allowed"
        });
    }

    try {
        const {
            question,
            subject,
            explanationLevel
        } = req.body || {};

        // Check question
        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Question is required"
            });
        }

        const prompt = `
You are StudyAI, an AI homework helper for students.

Subject: ${subject || "General"}
Explanation level: ${explanationLevel || "Simple"}

Student's question:
${question}

Instructions:
- Give an accurate answer.
- Explain clearly in student-friendly language.
- Show steps for mathematics and science questions.
- Keep the explanation appropriate for a school student.
- Do not make the answer unnecessarily complicated.
- If the question is unclear, explain what information is missing.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return res.status(200).json({
            answer: response.text
        });

    } catch (error) {
        console.error("StudyAI AI Error:", error);

        return res.status(500).json({
            error: "Failed to generate AI answer",
            details: error.message
        });
    }
};
