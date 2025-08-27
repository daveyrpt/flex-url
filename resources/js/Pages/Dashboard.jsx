import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import FileUpload from '@/Components/FileUpload';
import ChatBot from '@/Components/ChatBot';

export default function Dashboard({ auth }) {
    const [activeSection, setActiveSection] = useState('upload');

    const renderContent = () => {
        switch (activeSection) {
            case 'upload':
                return <FileUpload />;
            case 'chat':
                return <ChatBot />;
            default:
                return <FileUpload />;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="flex h-screen pt-16">
                <Sidebar 
                    activeSection={activeSection} 
                    onSectionChange={setActiveSection} 
                />
                
                <div className="flex-1 p-8 bg-gray-50 overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
