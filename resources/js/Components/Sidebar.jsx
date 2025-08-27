import { useState } from 'react';

export default function Sidebar({ activeSection, onSectionChange }) {
    const menuItems = [
        { id: 'upload', name: 'File Upload', icon: '📁' },
        { id: 'chat', name: 'AI Chat Bot', icon: '🤖' }
    ];

    return (
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Dashboard Menu</h2>
                
                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                                activeSection === item.id
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}