"use server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatbotAi = async (data) => {
    try {
        const { message, ticketId, ticketData, isFirstMessage = false } = data;

        if (!message || !message.trim()) {
            return {
                success: false,
                error: "Message is required"
            };
        }

        // Get the generative model
        const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Create context for the AI based on ticket data
        let context = `You are an AI support assistant helping with a support ticket. Here are the details of the ticket:

Ticket ID: ${ticketData?.id || ticketId}
Subject: ${ticketData?.subject || 'Not provided'}
Description: ${ticketData?.description || 'Not provided'}
Status: ${ticketData?.status || 'Not provided'}
Priority: ${ticketData?.priority || 'Not provided'}
Category: ${ticketData?.category?.name || 'Not provided'}
Created: ${ticketData?.createdAt ? new Date(ticketData.createdAt).toLocaleDateString() : 'Not provided'}
Creator: ${ticketData?.creator?.name || 'Not provided'}

${isFirstMessage 
    ? `This is the first message from the user. You can greet them naturally if appropriate, but don't repeat their name in subsequent responses.` 
    : `Continue the conversation naturally without repeating greetings or the user's name unless specifically relevant to the context.`
}

Please provide helpful, accurate, and professional assistance based on this ticket information. If the user asks questions about the ticket, refer to the above details. If they need technical help, provide clear and actionable solutions. Answer in less than or equal to 5 sentences. Don't use any special characters like emojis or markdown formatting.

User's question: ${message}`;

        // Generate response from AI
        const result = await model.generateContent(context);
        const response = result.response;
        const aiMessage = response.text();

        return {
            success: true,
            message: aiMessage,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Chatbot AI error:', error);
        return {
            success: false,
            error: error.message || "Failed to get AI response"
        };
    }
};

const generalChat = async (data) => {
    try {
        const { userId: clerkUserId } = await auth();
        const user = await db.user.findUnique({
            where: { clerkUserId }
        });
        if (!clerkUserId) {
            throw new Error("Unauthorized - Please sign in to continue.");
        }

        console.log("User found:", { id: user.id, name: user.name });
        const { message, isFirstMessage = false } = data;

        if (!message || !message.trim()) {
            return {
                success: false,
                error: "Message is required"
            };
        }

        // Get the generative model
        const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Create context for the AI based on ticket data
        let context = `You are an AI support assistant in a support web application. 

${isFirstMessage 
    ? `The user's name is ${user.name || 'Not provided'}. You can greet them naturally if appropriate, but don't repeat their name in subsequent responses unless specifically relevant.` 
    : `Continue the conversation naturally without repeating greetings or the user's name unless specifically relevant to the context.`
}

Please provide helpful, accurate, and professional assistance. If they need technical help, provide clear and actionable solutions. Answer in less than or equal to 5 sentences. Don't use any special characters like emojis or markdown formatting.

User's question: ${message}`;

        // Generate response from AI
        const result = await model.generateContent(context);
        const response = result.response;
        const aiMessage = response.text();

        return {
            success: true,
            message: aiMessage,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Chatbot AI error:', error);
        return {
            success: false,
            error: error.message || "Failed to get AI response"
        };
    }
};

export { chatbotAi, generalChat };