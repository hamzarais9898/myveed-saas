'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllUsers, updateUser, suspendUser, deleteUser } from '@/services/adminService';
import { motion, AnimatePresence } from 'framer-motion';

const UserRow = ({ user, index, onEdit, onSuspend, onDelete }: any) => {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group hover:bg-gray-50/80 transition-all border-b border-gray-100"
        >
            <td className="px-6 py-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#e2a9f1]/20 group-hover:rotate-6 transition-transform">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-black text-gray-900 tracking-tight">{user.name || 'N/A'}</div>
                        <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.subscription?.plan === 'professional' ? 'bg-purple-100 text-purple-700' :
                        user.subscription?.plan === 'expert' ? 'bg-blue-100 text-blue-700' :
                            user.subscription?.plan === 'creator' ? 'bg-pink-100 text-pink-700' :
                                'bg-gray-100 text-gray-700'
                    }`}>
                    {user.subscription?.plan || 'free'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">{user.subscription?.credits || 0}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Shorts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">{user.subscription?.ttsCredits || 0}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">TTS</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{user.videoCount || 0}</span>
                    <span className="w-2 h-2 rounded-full bg-[#e2a9f1]" />
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        user.status === 'suspended' ? 'bg-rose-100 text-rose-700' :
                            'bg-gray-100 text-gray-700'
                    }`}>
                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                </span>
            </td>
            <td className="px-6 py-4 text-xs font-bold text-gray-400">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={() => onEdit(user)}
                        className="p-3 bg-white border border-gray-100 text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm transition-all hover:-translate-y-1"
                        title="Modifier"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onSuspend(user._id)}
                        className="p-3 bg-white border border-gray-100 text-orange-600 hover:bg-orange-50 rounded-xl shadow-sm transition-all hover:-translate-y-1"
                        title="Suspendre"
                    >
                        ⏸️
                    </button>
                    <button
                        onClick={() => onDelete(user._id)}
                        className="p-3 bg-white border border-gray-100 text-red-600 hover:bg-red-50 rounded-xl shadow-sm transition-all hover:-translate-y-1"
                        title="Supprimer"
                    >
                        🗑️
                    </button>
                </div>
            </td>
        </motion.tr>
    );
};

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        plan: '',
        status: '',
        page: 1,
        limit: 50
    });

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllUsers(filters);
            setUsers(response.users);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUser(selectedUser._id, {
                name: selectedUser.name,
                email: selectedUser.email,
                role: selectedUser.role,
                status: selectedUser.status,
                subscription: {
                    plan: selectedUser.subscription?.plan,
                    credits: selectedUser.subscription?.credits,
                    ttsCredits: selectedUser.subscription?.ttsCredits
                }
            });
            setShowEditModal(false);
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleSuspendUser = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) return;
        try {
            await suspendUser(userId);
            loadUsers();
        } catch (error) {
            console.error('Error suspending user:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;
        try {
            await deleteUser(userId);
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestion des Utilisateurs</h1>
                    <p className="text-gray-500 font-medium mt-1">Supervisez et gérez les comptes de votre plateforme</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Base totale</p>
                        <p className="text-2xl font-black text-gray-900 text-center">{users.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-16 pr-6 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold text-gray-800 focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all outline-none"
                        />
                    </div>
                    <select
                        value={filters.plan}
                        onChange={(e) => setFilters({ ...filters, plan: e.target.value, page: 1 })}
                        className="px-6 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                    >
                        <option value="">Tous les plans</option>
                        <option value="free">Gratuit</option>
                        <option value="creator">Créateur</option>
                        <option value="expert">Expert</option>
                        <option value="professional">Professionnel</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-6 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="suspended">Suspendu</option>
                    </select>
                    <button
                        onClick={loadUsers}
                        className="p-4 bg-gray-900 text-white rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-400/40"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">Extraction des profils...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Profil</th>
                                    <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Offre</th>
                                    <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ressources</th>
                                    <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Prod.</th>
                                    <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Statut</th>
                                    <th className="px-6 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inscription</th>
                                    <th className="px-6 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {users.map((user, i) => (
                                        <UserRow
                                            key={user._id}
                                            user={user}
                                            index={i}
                                            onEdit={handleEditUser}
                                            onSuspend={handleSuspendUser}
                                            onDelete={handleDeleteUser}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="py-20 text-center">
                                <span className="text-4xl mb-4 block">👻</span>
                                <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Aucun utilisateur trouvé</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && selectedUser && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] max-w-2xl w-full shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Modifier l&apos;utilisateur</h2>
                                <p className="text-gray-500 font-medium">Modifiez les privilèges et les ressources du compte</p>
                            </div>
                            <form onSubmit={handleUpdateUser} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom Complet</label>
                                        <input
                                            type="text"
                                            value={selectedUser.name || ''}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse Email</label>
                                        <input
                                            type="email"
                                            value={selectedUser.email}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rôle Système</label>
                                        <select
                                            value={selectedUser.role}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        >
                                            <option value="user">Utilisateur</option>
                                            <option value="admin">Administrateur</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Statut du Compte</label>
                                        <select
                                            value={selectedUser.status}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        >
                                            <option value="active">Actif</option>
                                            <option value="suspended">Suspendu</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Formule d&apos;Abonnement</label>
                                    <select
                                        value={selectedUser.subscription?.plan || 'free'}
                                        onChange={(e) => setSelectedUser({
                                            ...selectedUser,
                                            subscription: { ...selectedUser.subscription, plan: e.target.value }
                                        })}
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                    >
                                        <option value="free">Gratuit</option>
                                        <option value="creator">Créateur</option>
                                        <option value="expert">Expert</option>
                                        <option value="professional">Professionnel</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Crédits Shorts</label>
                                        <input
                                            type="number"
                                            value={selectedUser.subscription?.credits || 0}
                                            onChange={(e) => setSelectedUser({
                                                ...selectedUser,
                                                subscription: { ...selectedUser.subscription, credits: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Crédits TTS</label>
                                        <input
                                            type="number"
                                            value={selectedUser.subscription?.ttsCredits || 0}
                                            onChange={(e) => setSelectedUser({
                                                ...selectedUser,
                                                subscription: { ...selectedUser.subscription, ttsCredits: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-8 py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-400/40 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Sauvegarder
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
