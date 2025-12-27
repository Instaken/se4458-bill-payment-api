import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Lock, Loader2 } from 'lucide-react';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your Bill Payment assistant. How can I help you today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hello! I am your Bill Payment assistant. How can I help you today?' }] }
    ]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAuth = (e) => {
        e.preventDefault();
        if (apiKey.trim()) {
            setIsAuthenticated(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Get your API Gateway URL
            const GATEWAY_URL = 'https://se4458-gateway-56db6ro4.ew.gateway.dev';

            const response = await fetch(`${GATEWAY_URL}/chat?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: history
                })
            });

            if (response.status === 401 || response.status === 403) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: '❌ Authentication failed. Please refresh and enter a valid API key.'
                }]);
                return;
            }

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Update history
            setHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ text: data.text }] }
            ]);

            setMessages(prev => [...prev, { role: 'ai', text: data.text }]);

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: '❌ Sorry, something went wrong. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <div className="auth-icon">
                        <Lock size={48} />
                    </div>
                    <h1>Bill Payment AI Assistant</h1>
                    <p>SE 4458 - Software Architecture & Design</p>
                    <form onSubmit={handleAuth}>
                        <input
                            type="password"
                            placeholder="Enter your API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="auth-input"
                            autoFocus
                        />
                        <button type="submit" className="auth-button">
                            Start Chatting
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <Bot className="header-icon" size={28} />
                    <div>
                        <h1>Bill Payment AI Assistant</h1>
                        <p>Powered by Google Gemini</p>
                    </div>
                </div>
            </header>

            <div className="chat-container">
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-icon">
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className="message-content">
                                <div className="message-text">{msg.text}</div>
                                <div className="message-time">
                                    {new Date().toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message ai typing">
                            <div className="message-icon">
                                <Bot size={20} />
                            </div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={sendMessage} className="input-container">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about bills, payments, or details..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="message-input"
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="send-button"
                >
                    {isLoading ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
                </button>
            </form>
        </div>
    );
}

export default App;
