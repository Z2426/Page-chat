import React, { useState } from "react";
import ChatWindow from "./components/ChatWindow"; // Giả sử đây là file chứa component ChatWindow

function App() {
  const [userId, setUserId] = useState(""); // State for storing the userId
  const [conversationId, setConversationId] = useState(""); // State for storing the conversationId
  const [isValidUserId, setIsValidUserId] = useState(true); // State to validate userId input
  const [isValidConversationId, setIsValidConversationId] = useState(true); // State to validate conversationId input

  // Function to handle userId input
  const handleUserIdChange = (e) => {
    const newUserId = e.target.value;
    setUserId(newUserId);
    setIsValidUserId(!!newUserId); // Validate that userId is not empty
  };

  // Function to handle conversationId input
  const handleConversationIdChange = (e) => {
    const newConversationId = e.target.value;
    setConversationId(newConversationId);
    setIsValidConversationId(!!newConversationId); // Validate that conversationId is not empty
  };

  // Function to reset userId (for testing in a new tab)
  const resetUserId = () => {
    setUserId(""); // Clear current userId to reset the input field
  };

  // Function to reset conversationId (for testing in a new tab)
  const resetConversationId = () => {
    setConversationId(""); // Clear current conversationId to reset the input field
  };

  return (
    <div>
      <h1>Chat App</h1>

      {/* User ID Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={handleUserIdChange}
        />
        <button onClick={resetUserId}>Reset User ID</button>
      </div>

      {/* Conversation ID Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter Conversation ID"
          value={conversationId}
          onChange={handleConversationIdChange}
        />
        <button onClick={resetConversationId}>Reset Conversation ID</button>
      </div>

      {/* Show ChatWindow if both userId and conversationId are valid */}
      {isValidUserId && isValidConversationId ? (
        <ChatWindow userId={userId} conversationId={conversationId} />
      ) : (
        <p>Please enter valid User ID and Conversation ID to start chatting.</p>
      )}
    </div>
  );
}

export default App;
