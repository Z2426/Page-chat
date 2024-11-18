import React, { useState, useEffect, useRef } from "react";
import socket from "../services/socket"; // Socket.IO client instance
import { fetchChatHistory } from "../services/api"; // Import necessary functions

const ChatWindow = ({ userId, conversationId }) => {
    const [messages, setMessages] = useState([]); // List of messages
    const [isConnected, setIsConnected] = useState(false); // Connection status
    const [isOnline, setIsOnline] = useState(false); // User online status
    const [loadingHistory, setLoadingHistory] = useState(false); // Loading history flag
    const [currentPage, setCurrentPage] = useState(1); // Track current page
    const chatContainerRef = useRef(null); // Ref to the chat container to handle scroll

    useEffect(() => {
        // Fetch chat history when conversationId changes
        const loadChatHistory = async () => {
            try {
                const response = await fetchChatHistory(conversationId, 10); // Fetch 10 latest messages
                if (response?.messages) {
                    setMessages(response.messages.reverse()); // Reverse to display the most recent first
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
                setIsOnline(true); // Set user as online when connected
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
                setIsOnline(false); // Set user as offline when disconnected
                console.log("Socket.IO disconnected");
            });
        };

        // Handle incoming messages from server
        const handleIncomingMessage = (message) => {
            console.log("Received message from server:", message);
            if (message.conversationId === conversationId) {
                // Add new message at the end (newest last)
                setMessages((prev) => [...prev, message]); // Add new message at the end
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
        if (loadingHistory || !conversationId) return;
        setLoadingHistory(true);

        try {
            const response = await fetchChatHistory(conversationId, 10, currentPage + 1); // Fetch 10 older messages
            if (response?.messages) {
                const newMessages = response.messages.reverse(); // Reverse to display older messages first
                setMessages((prevMessages) => {
                    // Remove duplicates by using Map (ensures _id is unique)
                    const uniqueMessages = [
                        ...new Map(
                            [...newMessages, ...prevMessages].map((msg) => [msg._id, msg])
                        ).values(),
                    ];
                    return uniqueMessages;
                });
                setCurrentPage((prev) => prev + 1); // Increment current page
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
        setMessages((prev) => [...prev, message]); // Add new message at the end (newest last)
    };

    // Ensure the chat scrolls to the bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; // Scroll to the bottom when new messages are added
        }
    }, [messages]); // Scroll to the bottom on new message

    return (
        <div>
            {/* Display chat window */}
            <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <div
                        style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: isOnline ? "green" : "red",
                            marginRight: "5px",
                        }}
                    ></div>
                    <span>{isOnline ? "Online" : "Offline"}</span>
                </div>
            </div>
            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    maxHeight: "400px",
                    overflowY: "auto",
                }}
                ref={chatContainerRef}
                onScroll={handleScroll} // Listen for scroll events to load old messages
            >
                {/* Render messages */}
                {messages.length === 0 ? (
                    <p>No messages yet. Start chatting!</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg._id || `message-${index}`} // Ensure that each element has a unique key
                            style={{
                                display: "flex",
                                justifyContent: msg.senderId === userId ? "flex-end" : "flex-start", // Align based on sender
                                marginBottom: "10px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: msg.senderId === userId ? "#cce7ff" : "#E4E6EB", // Different background color for different senders
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    maxWidth: "80%",
                                    wordWrap: "break-word",
                                }}
                            >
                                <p>{msg.text}</p>
                                <div
                                    style={{
                                        fontSize: "0.8em",
                                        color: "#888",
                                        marginTop: "5px",
                                        textAlign: "left", // All timestamps aligned left for uniformity
                                    }}
                                >
                                    {formatTimestamp(msg.timestamp)} {/* Display timestamp */}
                                </div>
                            </div>
                        </div>
                    ))
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
