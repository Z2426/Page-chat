import React, { useState, useEffect, useRef } from "react";
import socket from "../services/socket"; // Socket.IO client instance
import { fetchChatHistory, ApisendMessage } from "../services/api"; // Import necessary functions

const ChatWindow = ({ userId, conversationId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const chatContainerRef = useRef(null);

    // Hàm gọi API lấy lịch sử chat
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

    useEffect(() => {
        // Fetch chat history when conversationId changes
        if (conversationId) {
            loadChatHistory();
        }
    }, [conversationId]);

    // Socket connection logic tách riêng
    useEffect(() => {
        const connectSocket = () => {
            socket.connect(); // Kết nối socket khi useEffect chạy

            socket.on("connect", () => {
                setIsConnected(true);
                setIsOnline(true); // Đặt người dùng là online khi kết nối thành công
                if (userId && conversationId) {
                    // Gửi sự kiện userOnline tới server
                    socket.emit("userOnline", { userId });

                    // Gửi sự kiện tham gia nhóm khi kết nối
                    socket.emit("joinGroup", { userId, groupId: conversationId });
                    console.log(`Sent userOnline and joinGroup events with userId: ${userId} and groupId: ${conversationId}`);
                }
                console.log("Successfully connected to Socket.IO");
            });

            socket.on("connect_error", (error) => {
                setIsConnected(false);
                console.error("Socket.IO connection error:", error);
            });

            socket.on("disconnect", () => {
                setIsConnected(false);
                setIsOnline(false); // Đặt người dùng là offline khi bị ngắt kết nối
                console.log("Socket.IO disconnected");

                if (userId && conversationId) {
                    // Gửi sự kiện leaveGroup khi ngắt kết nối
                    socket.emit("leaveGroup", { userId, groupId: conversationId });
                    console.log(`Sent leaveGroup event with userId: ${userId} and groupId: ${conversationId}`);
                }
            });
            socket.on("receiveMessage", (data) => {
                console.log("Received data:", data); // Log the full object received from the server

                // Check if the data contains the `message` field
                if (!data || !data.message) {
                    console.error("Invalid message format: ", data);
                    return;
                }

                // Extract the message from the `message` field
                const message = data.message;

                // Check if the message has all the necessary properties
                if (!message.senderId || !message.conversationId || !message.text) {
                    console.error("Invalid message object:", message);
                    return;
                }

                console.log("Valid message received:", message); // Log the extracted message

                // Make sure the message belongs to the current conversation
                if (conversationId === message.conversationId) {
                    // Add the message to the state
                    setMessages((prevMessages) => [...prevMessages, message]);
                } else {
                    console.warn("Message received for a different conversation:", message.conversationId);
                }
            });



        };

        connectSocket();

        // Cleanup khi component unmount
        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("disconnect");
            socket.off("receiveMessage");
            socket.disconnect(); // Ngắt kết nối khi component unmount
        };
    }, [userId, conversationId]); // Reconnect khi userId hoặc conversationId thay đổi

    // const sendMessage = (text) => {
    //     if (!text.trim()) return; // Nếu không có tin nhắn, không gửi

    //     const message = {
    //         senderId: userId,
    //         conversationId,
    //         text,
    //         timestamp: Date.now(), // Ensure timestamp is valid
    //     };
    //     console.log("Đã gửi tin nhắn", message);

    //     // Kiểm tra kết nối socket trước khi emit
    //     if (socket.connected) {
    //         // Gửi tin nhắn qua socket tới server
    //         socket.emit("sendMessage", {
    //             idConversation: conversationId,
    //             message,
    //         });
    //         setMessages((prev) => [...prev, message]); // Thêm tin nhắn vào danh sách
    //         console.log("da gui tin nhan");
    //     } else {
    //         console.error("Socket chưa kết nối. Không thể gửi tin nhắn.");
    //     }
    // };
    const sendMessage = async (text) => {
        if (!text.trim()) return; // Nếu không có tin nhắn, không gửi

        const message = {
            senderId: userId,
            conversationId,
            text,
            timestamp: Date.now(), // Ensure timestamp is valid
        };
        console.log("Đã gửi tin nhắn", message);

        // Kiểm tra kết nối socket trước khi emit
        if (socket.connected) {
            // Gửi tin nhắn qua socket tới server
            socket.emit("sendMessage", {
                idConversation: conversationId,
                message,
            });
            setMessages((prev) => [...prev, message]); // Thêm tin nhắn vào danh sách
            console.log("da gui tin nhan qua socket");
            //sendMessage(message)
            const sendedmessage = await ApisendMessage(message)
            console.log(sendedmessage)
        }
        else {
            console.error("Socket chưa kết nối. Không thể gửi tin nhắn.");
        }
    };
    // Xử lý scroll để tải lịch sử tin nhắn cũ
    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        if (scrollTop === 0 && !loadingHistory) {
            loadOldMessages();
        }
    };

    // Tải lịch sử tin nhắn cũ
    const loadOldMessages = async () => {
        if (loadingHistory || !conversationId) return;
        setLoadingHistory(true);

        try {
            const response = await fetchChatHistory(conversationId, 10, currentPage + 1); // Fetch older messages
            if (response?.messages) {
                const newMessages = response.messages.reverse(); // Reverse to display older messages first
                setMessages((prevMessages) => {
                    const uniqueMessages = [
                        ...new Map(
                            [...newMessages, ...prevMessages].map((msg) => [msg._id, msg])
                        ).values(),
                    ];
                    return uniqueMessages;
                });
                setCurrentPage((prev) => prev + 1); // Tăng số trang
            }
        } catch (error) {
            console.error("Error loading old messages:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Đảm bảo cuộn xuống dưới khi có tin nhắn mới
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div>
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
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <p>No messages yet. Start chatting!</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg._id || `message-${index}`}
                            style={{
                                display: "flex",
                                justifyContent: msg.senderId === userId ? "flex-end" : "flex-start",
                                marginBottom: "10px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: msg.senderId === userId ? "#cce7ff" : "#E4E6EB",
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
                                        textAlign: "left",
                                    }}
                                >
                                    {new Date(msg.timestamp).getTime() ? (
                                        new Date(msg.timestamp).toLocaleString()
                                    ) : (
                                        <span>Invalid Date</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage(e.target.value);
                            e.target.value = "";
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
