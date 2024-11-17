import React, { useState, useEffect, useRef } from "react";
import { fetchChatHistory } from "../services/api"; // API để fetch lịch sử tin nhắn
import socket from "../services/socket"; // Socket.IO client instance
import Message from "./Message"; // Component để hiển thị tin nhắn

const ChatWindow = ({ userId, conversationId }) => {
    const [messages, setMessages] = useState([]); // Danh sách tin nhắn
    const [isConnected, setIsConnected] = useState(false); // Trạng thái kết nối
    const [loadingHistory, setLoadingHistory] = useState(false); // Trạng thái loading cho lịch sử tin nhắn
    const chatContainerRef = useRef(null);

    // Fetch lịch sử tin nhắn
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                setLoadingHistory(true);
                const response = await fetchChatHistory(conversationId, 20); // Fetch 20 tin nhắn mới nhất
                if (response?.messages) {
                    setMessages(response.messages);
                }
            } catch (error) {
                console.error("Lỗi khi lấy lịch sử tin nhắn:", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        loadChatHistory();
    }, [conversationId]);

    // Kết nối Socket.IO và lắng nghe sự kiện
    useEffect(() => {
        socket.on("connect", () => {
            setIsConnected(true);
            if (userId) {
                socket.emit("userOnline", { userId });
                console.log(`Gửi sự kiện userOnline với userId: ${userId}`);
            }
            console.log("Kết nối thành công với Socket.IO");
        });

        socket.on("connect_error", (error) => {
            setIsConnected(false);
            console.error("Lỗi kết nối Socket.IO:", error);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
            console.log("Mất kết nối Socket.IO");
        });

        // Lắng nghe tin nhắn mới từ server
        const handleIncomingMessage = (data) => {
            const { message } = data;
            console.log("Nhận được tin nhắn từ server:", message);

            if (message.conversationId === conversationId) {
                setMessages((prevMessages) => [...prevMessages, message]); // Thêm tin nhắn vào cuối danh sách

                // Cuộn xuống dưới cùng khi có tin nhắn mới
                chatContainerRef.current?.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: "smooth",
                });
            }
        };

        // Lắng nghe sự kiện "receivePersonalMessage" từ server
        socket.on("receivePersonalMessage", handleIncomingMessage);

        // Cleanup khi unmount hoặc khi sự kiện thay đổi
        return () => {
            socket.off("receivePersonalMessage", handleIncomingMessage);
            socket.off("connect");
            socket.off("connect_error");
            socket.off("disconnect");
        };
    }, [conversationId]);

    // Kiểm tra khi cuộn để tải lịch sử tin nhắn cũ
    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

        // Kiểm tra nếu người dùng đang cuộn lên trên (đến đầu)
        if (scrollTop === 0 && !loadingHistory) {
            loadOldMessages(); // Gọi hàm tải lịch sử tin nhắn cũ
        }

        // Nếu cuộn xuống dưới cùng, không làm gì vì đã có tin nhắn mới
        if (scrollTop + clientHeight === scrollHeight) {
            // Đảm bảo khi cuộn xuống dưới sẽ không bị tự động cuộn lại khi đang tải lịch sử
        }
    };

    // Tải lịch sử tin nhắn cũ
    const loadOldMessages = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetchChatHistory(conversationId, 20, messages[0]._id); // Fetch 20 tin nhắn cũ hơn
            if (response?.messages) {
                setMessages((prevMessages) => [...response.messages, ...prevMessages]); // Thêm tin nhắn cũ vào đầu danh sách
            }
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn cũ:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Gửi tin nhắn
    const sendMessage = (text) => {
        const message = {
            senderId: userId,
            conversationId,
            text,
            timestamp: Date.now(),
        };

        socket.emit("sendMessage", message); // Gửi tin nhắn qua socket
        setMessages((prev) => [...prev, message]); // Hiển thị ngay tin nhắn mới
    };

    return (
        <div>
            <div
                style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column", // Giữ tin nhắn hiển thị từ trên xuống dưới
                }}
                ref={chatContainerRef}
                onScroll={handleScroll} // Lắng nghe sự kiện cuộn
            >
                {loadingHistory && <p>Đang tải lịch sử tin nhắn...</p>}
                {!loadingHistory && messages.length === 0 && (
                    <p>Chưa có tin nhắn nào.</p>
                )}
                {messages.map((msg) => (
                    <Message key={msg._id} message={msg} currentUserId={userId} />
                ))}
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                            sendMessage(e.target.value);
                            e.target.value = "";
                        }
                    }}
                />
            </div>
            <div style={{ marginTop: "10px" }}>
                <strong>Trạng thái: </strong>
                <span style={{ color: isConnected ? "green" : "red" }}>
                    {isConnected ? "Đang online" : "Mất kết nối"}
                </span>
            </div>
        </div>
    );
};

export default ChatWindow;

// import React, { useState, useEffect, useRef } from "react";
// import { fetchChatHistory } from "../services/api"; // API để fetch lịch sử tin nhắn
// import socket from "../services/socket"; // Socket.IO client instance
// import Message from "./Message"; // Component để hiển thị tin nhắn

// const ChatWindow = ({ userId, conversationId }) => {
//     const [messages, setMessages] = useState([]); // Danh sách tin nhắn
//     const [isConnected, setIsConnected] = useState(false); // Trạng thái kết nối
//     const [loadingHistory, setLoadingHistory] = useState(true); // Trạng thái loading cho lịch sử tin nhắn
//     const chatContainerRef = useRef(null);

//     // Fetch lịch sử tin nhắn
//     useEffect(() => {
//         const loadChatHistory = async () => {
//             try {
//                 setLoadingHistory(true);
//                 const response = await fetchChatHistory(conversationId, 20); // Fetch 20 tin nhắn mới nhất
//                 if (response?.messages) {
//                     setMessages(response.messages);

//                     // Cuộn xuống dưới cùng khi tải xong lịch sử tin nhắn
//                     setTimeout(() => {
//                         chatContainerRef.current?.scrollTo({
//                             top: chatContainerRef.current.scrollHeight,
//                             behavior: "smooth",
//                         });
//                     }, 100);
//                 }
//             } catch (error) {
//                 console.error("Lỗi khi lấy lịch sử tin nhắn:", error);
//             } finally {
//                 setLoadingHistory(false);
//             }
//         };

//         loadChatHistory();
//     }, [conversationId]);

//     // Kết nối Socket.IO và lắng nghe sự kiện
//     useEffect(() => {
//         // Kết nối socket
//         socket.on("connect", () => {
//             setIsConnected(true);
//             if (userId) {
//                 socket.emit("userOnline", { userId });
//                 console.log(`Gửi sự kiện userOnline với userId: ${userId}`);
//             }
//             console.log("Kết nối thành công với Socket.IO");
//         });

//         socket.on("connect_error", (error) => {
//             setIsConnected(false);
//             console.error("Lỗi kết nối Socket.IO:", error);
//         });

//         socket.on("disconnect", () => {
//             setIsConnected(false);
//             console.log("Mất kết nối Socket.IO");
//         });

//         // Lắng nghe tin nhắn mới từ server
//         const handleIncomingMessage = (message) => {
//             console.log("Nhận được tin nhắn từ server:", message);
//             if (message.conversationId === conversationId) {
//                 setMessages((prev) => [...prev, message]);
//                 chatContainerRef.current?.scrollTo({
//                     top: chatContainerRef.current.scrollHeight,
//                     behavior: "smooth",
//                 });
//             }
//         };

//         socket.on("receivePersonalMessage", handleIncomingMessage);

//         // Cleanup khi unmount
//         return () => {
//             socket.off("connect");
//             socket.off("connect_error");
//             socket.off("disconnect");
//             socket.off("receiveMessage", handleIncomingMessage);
//         };
//     }, [conversationId, userId]);

//     // Gửi tin nhắn
//     const sendMessage = (text) => {
//         const message = {
//             senderId: userId,
//             conversationId,
//             text,
//             timestamp: Date.now(),
//         };

//         socket.emit("sendMessage", message); // Gửi tin nhắn qua socket
//         setMessages((prev) => [...prev, message]); // Hiển thị ngay tin nhắn mới
//     };

//     return (
//         <div>
//             <div
//                 style={{
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                     maxHeight: "400px",
//                     overflowY: "auto",
//                     display: "flex",
//                     flexDirection: "column-reverse", // Tin nhắn mới nhất hiển thị ở dưới cùng
//                 }}
//                 ref={chatContainerRef}
//             >
//                 {loadingHistory && <p>Đang tải lịch sử tin nhắn...</p>}
//                 {!loadingHistory && messages.length === 0 && (
//                     <p>Chưa có tin nhắn nào.</p>
//                 )}
//                 {messages.map((msg, index) => (
//                     <Message key={msg._id || index} message={msg} currentUserId={userId} />
//                 ))}
//             </div>
//             <div>
//                 <input
//                     type="text"
//                     placeholder="Nhập tin nhắn..."
//                     onKeyDown={(e) => {
//                         if (e.key === "Enter" && e.target.value.trim()) {
//                             sendMessage(e.target.value);
//                             e.target.value = "";
//                         }
//                     }}
//                 />
//             </div>
//             <div style={{ marginTop: "10px" }}>
//                 <strong>Trạng thái: </strong>
//                 <span style={{ color: isConnected ? "green" : "red" }}>
//                     {isConnected ? "Đang online" : "Mất kết nối"}
//                 </span>
//             </div>
//         </div>
//     );
// };

// export default ChatWindow;
