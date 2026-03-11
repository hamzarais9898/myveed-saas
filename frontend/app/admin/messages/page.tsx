'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/services/authService';
import { Loader2, Mail, CheckCircle, Search, Clock, User, Trash2 } from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, new, read
    const [search, setSearch] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<any>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/contact`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, currentStatus: string) => {
        if (currentStatus === 'read') return;
        try {
            const token = getToken();
            await fetch(`${API_URL}/contact/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'read' })
            });
            // Update local state
            setMessages(messages.map(m => m._id === id ? { ...m, status: 'read' } : m));
            if (selectedMessage && selectedMessage._id === id) {
                setSelectedMessage({ ...selectedMessage, status: 'read' });
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'new' && m.status !== 'new') return false;
        if (filter === 'read' && m.status !== 'read') return false;
        if (search) {
            const term = search.toLowerCase();
            return (
                m.subject.toLowerCase().includes(term) ||
                m.email.toLowerCase().includes(term) ||
                (m.name && m.name.toLowerCase().includes(term))
            );
        }
        return true;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Messagerie Support</h1>
                    <p className="text-gray-500 mt-1">Gérez les demandes de contact des utilisateurs</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* List Column */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Tout
                        </button>
                        <button
                            onClick={() => setFilter('new')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'new' ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Nouveaux
                        </button>
                        <button
                            onClick={() => setFilter('read')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'read' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Lus
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                Aucun message trouvé
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg._id}
                                    onClick={() => {
                                        setSelectedMessage(msg);
                                        if (msg.status === 'new') handleMarkAsRead(msg._id, 'new');
                                    }}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedMessage?._id === msg._id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : msg.status === 'new'
                                            ? 'bg-white border-l-4 border-l-blue-500 border-y-gray-100 border-r-gray-100 font-medium'
                                            : 'bg-white border-transparent hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold truncate pr-2">{msg.subject}</h4>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                        <User className="w-3 h-3" />
                                        <span className="truncate">{msg.name || 'Anonyme'}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{msg.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    {selectedMessage ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedMessage.subject}</h2>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                            <Mail className="w-4 h-4 text-blue-500" />
                                            <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                                                {selectedMessage.email}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedMessage.status === 'new' && (
                                        <button
                                            onClick={() => handleMarkAsRead(selectedMessage._id, 'new')}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors"
                                        >
                                            Marquer comme lu
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-8 overflow-y-auto flex-1 bg-white">
                                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Mail className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium">Sélectionnez un message pour le lire</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
