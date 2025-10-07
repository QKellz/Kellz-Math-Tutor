import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { Difficulty, Rigor, QuizQuestion, Message, Sender } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
  
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBasePrompt = (difficulty: Difficulty, rigor: Rigor) => {
    return `You are "Kellz Math," a friendly, encouraging, and expert math tutor AI. 
    Your primary goal is to empower users by teaching them the process of solving mathematical problems, not just giving them the final answer. 
    You are patient, clear, and can break down complex topics into simple, understandable steps.
    Your current session is for a ${difficulty} level with ${rigor} rigor.
    Maintain a positive and encouraging tone always.`;
};

export const getInitialGreeting = async (difficulty: Difficulty, rigor: Rigor, mode: 'solver' | 'practice'): Promise<string> => {
    const modeText = mode === 'solver' 
        ? "I'm ready to help you with a specific problem. Please type it out, or upload a picture of it."
        : "I'm excited to help you practice a topic! What subject would you like to work on today? (e.g., 'fractions', 'linear algebra')";
    
    const prompt = `${getBasePrompt(difficulty, rigor)}
    You are starting a new session. The user has selected ${mode} mode. 
    Provide a brief, welcoming greeting and then ask for the next piece of information you need.
    For solver mode, ask for the problem.
    For practice mode, ask for the topic.
    
    Example response for practice mode: "Excellent choice! Let's begin. What topic would you like to practice today?"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching initial greeting:", error);
        return `I'm sorry, I'm having a little trouble starting. Let's try again. What ${mode === 'practice' ? 'topic' : 'problem'} would you like to work on?`;
    }
};

export const generateQuiz = async (topic: string, difficulty: Difficulty, rigor: Rigor): Promise<QuizQuestion[]> => {
    const prompt = `Based on a ${difficulty} level and ${rigor} rigor, generate a 5-question quiz on the topic of "${topic}".
    The questions should be challenging but appropriate for the selected levels. 
    Ensure the questions cover a range of concepts within the topic.
    Return the quiz as a JSON array.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            answer: { type: Type.STRING, description: "The correct answer to the question. For multiple choice, just the correct letter/value." },
                        },
                        required: ["question", "answer"],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error generating quiz:", error);
        // Fallback quiz
        return [
            { question: `What is 2 + 2? (Error generating quiz for ${topic})`, answer: "4" },
            { question: `What is 5 * 5?`, answer: "25" },
        ];
    }
};


export const getNextResponse = async (
    history: Message[],
    difficulty: Difficulty,
    rigor: Rigor
): Promise<string> => {
    
    const systemInstruction = getBasePrompt(difficulty, rigor) + `
    You are in an ongoing problem-solving session. The user has provided a math problem, and you are guiding them step-by-step.
    - Analyze the entire conversation history to understand the problem and where you left off.
    - When the user asks for the "Next Step", provide the single, concise next step in the solution process.
    - If the user provides the initial problem, acknowledge it and provide ONLY the very first conceptual step to solve it.
    - DO NOT solve the entire problem at once. Your goal is to guide, not to give answers.
    - Maintain the conversation flow. Do not re-introduce yourself or forget the context.
    - Keep your persona as "Kellz Math" - friendly, encouraging, and an expert tutor.
    `;

    const contents = history.map(msg => {
        const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
        if (msg.text) {
             parts.push({ text: msg.text });
        }
        if (msg.image) {
            parts.push({
                inlineData: {
                    mimeType: 'image/png', // Assuming png for now
                    data: msg.image,
                },
            });
        }
        
        return {
            role: msg.sender === Sender.USER ? 'user' : 'model',
            parts: parts,
        };
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction
            }
        });
        return response.text;
    } catch(error) {
        console.error("Error in getNextResponse", error);
        return "I'm sorry, I encountered an error. Could you please try that again?"
    }
};

export const generateLearningPath = async (problem: string, difficulty: Difficulty, rigor: Rigor): Promise<string> => {
    const prompt = `${getBasePrompt(difficulty, rigor)}
    You are an expert curriculum designer. A student needs help understanding the concepts required to solve a specific math problem.

    The student's problem is: "${problem}"

    Your task is to create a personalized, step-by-step learning path for this student. The path should be tailored to their ${difficulty} level with ${rigor} rigor.

    The learning path should:
    1. Start with the most foundational, prerequisite concepts.
    2. Logically build up to the concepts directly needed to solve the given problem.
    3. Break down the path into clear, numbered steps or bullet points.
    4. For each step, briefly explain what the concept is and why it's important for the final problem.
    5. Use simple markdown to highlight key topics by wrapping them in double asterisks, like **this**.

    Example Structure:
    "Here is a learning path to help you master the concepts for this problem:
    1. **Understanding Variables**: First, we need to be comfortable with what a variable (like 'x') represents in math.
    2. **Basic Operations**: Next, we'll review the order of operations (PEMDAS).
    3. **Inverse Operations**: Then, we'll learn how to "undo" operations, like using subtraction to undo addition.
    4. **Solving for a Variable**: Finally, we'll put it all together to isolate 'x' and find its value."

    Generate the learning path now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating learning path:", error);
        return "I'm sorry, I had trouble creating a learning path for that problem. Let's try focusing on the next step instead.";
    }
};


export const analyzeIncorrectWork = async (problem: string, userAnswer: string, userWorkImage?: string) => {
    const prompt = `${getBasePrompt(Difficulty.MIDDLE_SCHOOL, Rigor.INTERMEDIATE)}
    The user was trying to solve this problem: "${problem}".
    Their incorrect answer was: "${userAnswer}".
    Here is the work they submitted: ${userWorkImage ? "An image is attached." : "No image, analyze based on problem and answer."}
    
    Your task is to:
    1. Analyze their work to identify the specific conceptual or procedural error.
    2. Start your response by thanking them for showing their work.
    3. Point out the exact mistake in their work (e.g., "I see the error is in the second step where you subtracted before dividing.").
    4. Briefly explain WHY it's a mistake, referencing the correct rule or concept (e.g., "Let's review why division comes first in the order of operations.").
    5. Finally, begin the step-by-step guidance to walk them through the correct solution. Provide ONLY the first correct step and then wait for them to respond.
    
    Example response: "Thanks for sharing your work! I see exactly what happened. You correctly solved the part in the parentheses first. The mistake was in the next step: you did the subtraction before the division. Let's review why division comes first in the order of operations (PEMDAS). The first step, as you did, is to solve the parentheses. What is 3 + 2?"
    `;

    try {
         if (userWorkImage) {
            const imagePart = { inlineData: { mimeType: 'image/png', data: userWorkImage } };
            const textPart = { text: prompt };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [textPart, imagePart] },
            });
            return response.text;
        } else {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        }
    } catch(e) {
        console.error("Error analyzing work", e);
        return "I'm having trouble analyzing the work, but let's walk through the problem together. What is the first step?";
    }
}