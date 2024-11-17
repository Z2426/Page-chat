import React from "react";

const Message = ({ message, currentUserId }) => {
    const isOwnMessage = message.senderId === currentUserId;

    return (
        <div style={{ textAlign: isOwnMessage ? "right" : "left", margin: "10px 0" }}>
            <div style={{ display: "inline-block", maxWidth: "70%", padding: "10px", borderRadius: "8px", background: isOwnMessage ? "#dcf8c6" : "#fff" }}>
                <p style={{ margin: 0 }}>{message.text}</p>
                <small style={{ fontSize: "0.8em", color: "#999" }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                </small>
            </div>
        </div>
    );
};

export default Message;
