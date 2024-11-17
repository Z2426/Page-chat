import axios from 'axios';

// Function to fetch chat history
export const fetchChatHistory = async (conversationId, limit = 20, page = 1) => {
    // Ensure the port is set correctly
    const port = process.env.PORT || '3007'; // Default to 3000 if no PORT is set
    const url = `http://localhost:${port}/chat/conversation/${conversationId}/messages`;

    const response = await axios.get(url, {
        params: { limit, page },
    });
    return response.data;
};
