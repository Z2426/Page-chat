import { io } from "socket.io-client";

// Khởi tạo socket với URL máy chủ
const SOCKET_URL = "ws://localhost:3005"; // Thay URL máy chủ
const socket = io(SOCKET_URL, {
    reconnection: true, // Tự động kết nối lại khi mất kết nối
    transports: ["websocket"], // Chỉ sử dụng WebSocket
});

export default socket;
