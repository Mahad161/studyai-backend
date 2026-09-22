const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);


/* =====================================================
   GEMINI
===================================================== */

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


/* =====================================================
   AI ENDPOINT
===================================================== */

app.post("/ask-ai", async (req, res) => {

    try {

        const {
            question,
            subject,
            style,
            conversation,
            image
        } = req.body;


        /* ---------------------------------------------
           VALIDATE QUESTION
        --------------------------------------------- */

        if (
            (!question || !question.trim()) &&
            !image
        ) {

            return res.status(400).json({
                error: "Please enter a question or upload a homework image."
            });

        }


        console.log("--------------------------------");
        console.log("StudyAI request received");
        console.log("Subject:", subject || "General");
        console.log("Style:", style || "Step-by-Step");
        console.log("Question:", question || "[Image question]");
        console.log("--------------------------------");


        /* ---------------------------------------------
           CONVERSATION
        --------------------------------------------- */

        let conversationText = "";

        if (
            Array.isArray(conversation) &&
            conversation.length > 0
        ) {

            conversationText =
                conversation
                    .slice(-10)
                    .map(item => {

                        if (
                            item.role === "user"
                        ) {

                            return `Student: ${item.content || ""}`;

                        }

                        if (
                            item.role === "assistant"
                        ) {

                            return `StudyAI: ${item.content || ""}`;

                        }

                        return "";

                    })
                    .filter(Boolean)
                    .join("\n");

        }


        /* ---------------------------------------------
           PROMPT
        --------------------------------------------- */

        const prompt = `
You are StudyAI, an AI homework assistant for school students.

SUBJECT:
${subject || "General"}

EXPLANATION STYLE:
${style || "Step-by-Step"}

STUDENT QUESTION:
${question || "The student has uploaded a homework image."}

PREVIOUS CONVERSATION:
${conversationText || "No previous conversation."}

IMPORTANT INSTRUCTIONS:

1. Answer the student's question accurately.
2. Use simple, student-friendly language.
3. Explain the answer clearly.
4. For Mathematics:
   - Show complete working.
   - Show formulas where useful.
   - Explain each calculation.
5. For Physics:
   - Identify the formula.
   - Substitute values.
   - Show calculations.
   - Give the final answer with units.
6. For Chemistry:
   - Explain reactions, formulas and concepts clearly.
7. For Biology:
   - Explain processes and definitions in easy language.
8. For Computer Science:
   - Explain code and concepts step by step.
9. For English:
   - Explain grammar, writing and literature clearly.
10. For Urdu:
   - Answer in clear and appropriate Urdu when required.
11. Keep the answer appropriate for a school student.
12. Do not unnecessarily complicate the answer.
13. If the question is ambiguous, explain what information is missing.
14. Do not pretend to see information that is not present in an uploaded image.
15. Give the final answer clearly.

Now answer the student's question.
`;


        /* ---------------------------------------------
           GEMINI REQUEST
        --------------------------------------------- */

        const response =
            await ai.models.generateContent({

                model: "gemini-2.5-flash",

                contents: prompt

            });


        /* ---------------------------------------------
           GET RESPONSE TEXT
        --------------------------------------------- */

        let answer = response.text;


        if (typeof answer === "function") {
            answer = answer();
        }


        if (
            !answer ||
            typeof answer !== "string"
        ) {

            console.error(
                "Gemini returned no usable text."
            );

            console.error(
                "Gemini response:",
                response
            );

            return res.status(500).json({
                error:
                    "Gemini generated a response, but no answer text was returned."
            });

        }


        console.log(
            "AI answer generated successfully."
        );

        console.log(
            "Answer length:",
            answer.length
        );


        /* ---------------------------------------------
           SEND RESPONSE
        --------------------------------------------- */

        return res.json({
            answer: answer
        });


    } catch (error) {

        console.error(
            "=============================="
        );

        console.error(
            "STUDYAI AI ERROR"
        );

        console.error(error);

        console.error(
            "=============================="
        );


        return res.status(500).json({

            error:
                error.message ||
                "Something went wrong while getting the AI answer."

        });

    }

});


/* =====================================================
   TEST ROUTE
===================================================== */

app.get("/", (req, res) => {

    res.send(
        "StudyAI AI server is running successfully!"
    );

});


/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, () => {

    console.log("");
    console.log("====================================");
    console.log("       STUDYAI AI SERVER");
    console.log("====================================");
    console.log(
        `Server running on port ${PORT}`
    );
    console.log(
        `Local URL: http://localhost:${PORT}`
    );
    console.log("====================================");
    console.log("");

});