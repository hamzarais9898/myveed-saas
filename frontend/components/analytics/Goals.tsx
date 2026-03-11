'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, Loader2 } from 'lucide-react';
import GoalCard from './GoalCard';
import GoalModal from './GoalModal';

interface GoalsProps {
    token: string | null;
    apiUrl: string;
}

export default function Goals({ token, apiUrl }: GoalsProps) {
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (token) {
            fetchGoals();
        }
    }, [token]);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/goals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGoals(data.data);
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            const res = await fetch(`${apiUrl}/goals/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGoals(goals.filter(g => g._id !== id));
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleGoalCreated = (newGoal: any) => {
        setGoals([newGoal, ...goals]);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#c77ddf] mb-4" />
                <p className="text-gray-500 font-medium">Chargement de vos objectifs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Mes Objectifs</h2>
                    <p className="text-gray-500 text-sm font-medium">Définissez et suivez vos cibles de croissance</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white px-6 py-4 rounded-2xl text-sm font-black transition-all shadow-lg shadow-[#e2a9f1]/30 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nouvel Objectif
                </button>
            </div>

            {goals.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#e2a9f1]/10">
                        <Target className="w-10 h-10 text-[#c77ddf]" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Aucun objectif défini</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
                        Boostez votre motivation en fixant des cibles précises pour vos vues, votre engagement ou vos revenus.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-[#c77ddf] font-black hover:underline flex items-center gap-2 mx-auto transition-all hover:gap-3"
                    >
                        Créer mon premier objectif <Plus className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => (
                        <GoalCard
                            key={goal._id}
                            goal={goal}
                            onDelete={handleDeleteGoal}
                        />
                    ))}
                </div>
            )}

            <GoalModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleGoalCreated}
                token={token}
                apiUrl={apiUrl}
            />
        </div>
    );
}
