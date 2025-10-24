import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { getChatMessages, sendChatMessage, subscribeToChatMessages } from '../lib/gameService';

function Chat({ roomCode, playerId, playerName }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const chatMessages = await getChatMessages(roomCode);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    if (roomCode) {
      loadMessages();
    }
  }, [roomCode]);

  // Subscribe to new messages
  useEffect(() => {
    if (!roomCode) return;

    const subscription = subscribeToChatMessages(roomCode, (payload) => {
      if (payload.new) {
        setMessages(prev => [...prev, payload.new]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [roomCode]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    try {
      await sendChatMessage(roomCode, playerId, playerName, trimmedMessage, false);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span className="chat-icon">💬</span>
        <h3>Chat</h3>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || index} 
              className={`chat-message ${msg.is_system_message ? 'system' : ''} ${msg.player_id === playerId ? 'own' : ''}`}
            >
              {msg.is_system_message ? (
                <div className="system-message">
                  <span className="system-icon">ℹ️</span>
                  <span className="system-text">{msg.message}</span>
                </div>
              ) : (
                <>
                  <div className="message-header">
                    <span className="message-author">{msg.player_name}</span>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
          disabled={isSending}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={!inputMessage.trim() || isSending}
          className="chat-send-btn"
        >
          {isSending ? '...' : '📤'}
        </button>
      </form>
    </div>
  );
}

export default Chat;
