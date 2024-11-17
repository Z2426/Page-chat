import React from "react";
import ChatWindow from "./components/ChatWindow";

function App() {
  const userId = "60d5c5f4e0f8a7451b7eaf46"; // Giả sử đã biết ID người dùng hiện tại
  const conversationId = "673490d16630bd00b48b0913"; // Giả sử đã biết ID cuộc trò chuyện

  return (
    <div>
      <h1>Chat App</h1>
      <ChatWindow userId={userId} conversationId={conversationId} />
    </div>
  );
}

export default App;
