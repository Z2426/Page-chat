import React, { useState, useEffect, useRef } from "react";
import socket from "../services/socket"; // Socket.IO client instance
import { fetchChatHistory } from "../services/api"; // Import necessary functions

const ChatWindow = ({ userId, conversationId }) => {
    const [messages, setMessages] = useState([]); // List of messages
    const [isConnected, setIsConnected] = useState(false); // Connection status
    const [loadingHistory, setLoadingHistory] = useState(false); // Loading history flag
    const chatContainerRef = useRef(null); // Ref to the chat container to handle scroll

    useEffect(() => {
        // Fetch chat history when conversationId changes
        const loadChatHistory = async () => {
            try {
                const response = await fetchChatHistory(conversationId, 20); // Fetch last 20 messages
                if (response?.messages) {
                    setMessages(response.messages); // Set messages
                }
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };

        // Fetch chat history when conversationId changes
        if (conversationId) {
            loadChatHistory();
        }

        // Initialize socket connection
        const connectSocket = () => {
            socket.connect(); // Explicitly connect when useEffect runs

            socket.on("connect", () => {
                setIsConnected(true);
                if (userId) {
                    socket.emit("userOnline", { userId }); // Notify server that user is online
                    console.log(`Sent userOnline event with userId: ${userId}`);
                }
                console.log("Successfully connected to Socket.IO");
            });

            socket.on("connect_error", (error) => {
                setIsConnected(false);
                console.error("Socket.IO connection error:", error);
            });

            socket.on("disconnect", () => {
                setIsConnected(false);
                console.log("Socket.IO disconnected");
            });
        };

        // Handle incoming messages from server
        const handleIncomingMessage = (message) => {
            console.log("Received message from server:", message);
            if (message.conversationId === conversationId) {
                setMessages((prev) => [...prev, message]); // Add new message to the list
            }
        };

        socket.on("receivePersonalMessage", handleIncomingMessage);

        // Call connectSocket to establish the connection
        connectSocket();

        // Cleanup on component unmount
        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("disconnect");
            socket.off("receivePersonalMessage", handleIncomingMessage);
            socket.disconnect(); // Disconnect when cleaning up
        };
    }, [userId, conversationId]); // Reconnect when userId or conversationId changes

    // Format the timestamp into a human-readable string (Date + Time)
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Localized format (Date and Time)
    };

    // Sort messages in ascending order of timestamp (oldest first)
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    // Handle scroll event to load old messages
    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

        // If user scrolls to the top, load older messages
        if (scrollTop === 0 && !loadingHistory) {
            loadOldMessages();
        }
    };

    // Load old messages when scrolling up
    const loadOldMessages = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetchChatHistory(conversationId, 20, messages[0]._id); // Fetch 20 older messages
            if (response?.messages) {
                setMessages((prevMessages) => [...response.messages, ...prevMessages]); // Prepend old messages
            }
        } catch (error) {
            console.error("Error loading old messages:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Send new message
    const sendMessage = (text) => {
        const message = {
            senderId: userId,
            conversationId,
            text,
            timestamp: Date.now(),
        };

        socket.emit("sendMessage", message); // Send message via socket
        setMessages((prev) => [...prev, message]); // Immediately show new message in chat
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; // Scroll to the bottom when new messages are added
        }
    }, [messages]); // Scroll to the bottom on new message

    return (
        <div>
            {/* Display chat window */}
            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column-reverse", // Ensures that the latest message is at the bottom
                }}
                ref={chatContainerRef}
                onScroll={handleScroll} // Listen for scroll events to load old messages
            >
                {/* Render messages */}
                {sortedMessages.length === 0 ? (
                    <p>No messages yet. Start chatting!</p>
                ) : (
                    sortedMessages.map((msg) => {
                        const isSender = msg.senderId === userId;
                        return (
                            <div
                                key={msg._id}
                                style={{
                                    display: "flex",
                                    justifyContent: isSender ? "flex-end" : "flex-start", // Align message based on sender
                                    marginBottom: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: isSender ? "#DCF8C6" : "#E4E6EB", // Color based on sender
                                        padding: "8px 12px",
                                        borderRadius: "10px",
                                        maxWidth: "80%",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    <strong>{isSender ? "You" : msg.sender}</strong>: {msg.text}
                                    <div
                                        style={{
                                            fontSize: "0.8em",
                                            color: "#888",
                                            marginTop: "5px",
                                            textAlign: isSender ? "right" : "left",
                                        }}
                                    >
                                        {formatTimestamp(msg.timestamp)} {/* Display timestamp */}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input field to send new messages */}
            <div>
                <input
                    type="text"
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                            sendMessage(e.target.value);
                            e.target.value = ""; // Clear the input field after sending
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
