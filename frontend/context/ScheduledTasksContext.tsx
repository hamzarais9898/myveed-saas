'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { publishFacebookVideo, publishYouTube, publishToTikTok, getTikTokStatus } from '@/services/publishService';
import { useToast } from './ToastContext';

interface ScheduledTask {
    id: string;
    videoId: string;
    platforms: string[];
    scheduledDate: string;
    tiktokAccountId?: string;
    status: 'pending' | 'completed' | 'failed';
    videoTitle?: string;
}

interface ScheduledTasksContextType {
    scheduleTask: (task: Omit<ScheduledTask, 'id' | 'status'>) => void;
    cancelTask: (taskId: string) => void;
    cancelTasksByVideoId: (videoId: string) => void;
    tasks: ScheduledTask[];
}

const ScheduledTasksContext = createContext<ScheduledTasksContextType | undefined>(undefined);

export const ScheduledTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const { showToast } = useToast();

    // Load tasks from localStorage on mount
    useEffect(() => {
        const savedTasks = localStorage.getItem('scheduled_publish_tasks');
        if (savedTasks) {
            try {
                setTasks(JSON.parse(savedTasks));
            } catch (e) {
                console.error("Failed to parse scheduled tasks", e);
            }
        }
    }, []);

    // Save tasks to localStorage when they change
    useEffect(() => {
        localStorage.setItem('scheduled_publish_tasks', JSON.stringify(tasks));
    }, [tasks]);

    // Checker interval
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const pendingTasks = tasks.filter(t => t.status === 'pending' && new Date(t.scheduledDate) <= now);

            pendingTasks.forEach(async (task) => {
                // Mark as processing to avoid double trigger
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));

                showToast(`Déclenchement de la publication planifiée pour "${task.videoTitle || 'Vidéo'}"`, "info");

                const platformPromises = task.platforms.map(async (platform) => {
                    try {
                        if (platform === 'facebook') {
                            await publishFacebookVideo(task.videoId, task.videoTitle);
                            return { platform, success: true };
                        }
                        if (platform === 'youtube') {
                            await publishYouTube(task.videoId, { title: task.videoTitle });
                            return { platform, success: true };
                        }
                        if (platform === 'tiktok') {
                            await publishToTikTok(task.videoId, task.videoTitle);
                            return { platform, success: true };
                        }
                    } catch (err: any) {
                        console.error(`Scheduled publish failed for ${platform}:`, err);
                        return { platform, success: false, error: err.message };
                    }
                });

                const results = await Promise.all(platformPromises);
                const failures = results.filter(r => r && !r.success);

                if (failures.length === 0) {
                    showToast(`Publication planifiée réussie ✅ (${task.platforms.join(', ')})`, "success");
                } else {
                    showToast(`Publication planifiée partielle ou échouée ❌`, "error");
                }
            });
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [tasks, showToast]);

    const scheduleTask = (taskData: Omit<ScheduledTask, 'id' | 'status'>) => {
        const newTask: ScheduledTask = {
            ...taskData,
            id: Math.random().toString(36).substring(2, 11),
            status: 'pending'
        };
        setTasks(prev => [...prev, newTask]);
        showToast("Publication planifiée avec succès !", "success");
    };

    const cancelTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const cancelTasksByVideoId = (videoId: string) => {
        setTasks(prev => prev.filter(t => t.videoId !== videoId));
    };

    return (
        <ScheduledTasksContext.Provider value={{ scheduleTask, cancelTask, cancelTasksByVideoId, tasks }}>
            {children}
        </ScheduledTasksContext.Provider>
    );
};

export const useScheduledTasks = () => {
    const context = useContext(ScheduledTasksContext);
    if (!context) {
        throw new Error('useScheduledTasks must be used within a ScheduledTasksProvider');
    }
    return context;
};
