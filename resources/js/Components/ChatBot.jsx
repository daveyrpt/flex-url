import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatBot() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || chatLoading) return;

        const userMessage = { role: 'user', content: newMessage };
        setMessages(prev => [...prev, userMessage]);
        setChatLoading(true);
        setNewMessage('');

        try {
            const response = await axios.post('/api/v1/chat/send', {
                message: newMessage
            });

            if (response.data.success) {
                const botMessage = { role: 'assistant', content: response.data.message };
                setMessages(prev => [...prev, botMessage]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to chat service.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
                <h3 className="text-lg font-medium mb-4">AI Chat Bot</h3>
                
                <div className="space-y-4">
                    {/* Chat Messages */}
                    <div className="h-96 border border-gray-200 rounded-lg p-4 overflow-y-auto bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                Start a conversation with the AI bot!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg max-w-xs ${
                                            message.role === 'user'
                                                ? 'bg-blue-500 text-white ml-auto'
                                                : 'bg-white text-gray-800 mr-auto border'
                                        }`}
                                    >
                                        <div className="text-xs font-medium mb-1">
                                            {message.role === 'user' ? 'You' : 'AI Bot'}
                                        </div>
                                        <div className="whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="bg-white text-gray-800 mr-auto border p-3 rounded-lg max-w-xs">
                                        <div className="text-xs font-medium mb-1">AI Bot</div>
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="flex space-x-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type your message here..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            disabled={chatLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || chatLoading}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}