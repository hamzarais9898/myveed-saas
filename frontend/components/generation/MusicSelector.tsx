'use client';

import { useState, useRef, useEffect } from 'react';

export interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    category: 'viral' | 'cinematic' | 'lofi' | 'energetic';
    duration: string;
    cover: string;
    previewUrl: string; // URL to mp3
}

const MUSIC_CATEGORIES = [
    { id: 'all', label: 'Tout' },
    { id: 'viral', label: 'Viral 🔥' },
    { id: 'cinematic', label: 'Film 🎬' },
    { id: 'lofi', label: 'Lofi ☁️' },
    { id: 'energetic', label: 'Énergie ⚡' },
];

const TRENDING_MUSIC: MusicTrack[] = [
    {
        id: '1',
        title: 'Flowers',
        artist: 'Miley Cyrus',
        category: 'viral',
        duration: '0:30',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/bf/1a/05/bf1a0528-6617-6425-4138-085e35327ec2/196589569438.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview123/v4/0d/95/96/0d959604-5f5f-3315-7798-251f28e21715/mzaf_13555543666299064434.plus.aac.p.m4a'
    },
    {
        id: '2',
        title: 'Epic Rise',
        artist: 'OlexandrMusic',
        category: 'cinematic',
        duration: '0:45',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/2c/fc/db/2cfcdb3b-0f90-d139-b1c0-c630a41fcc67/artwork.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/91/1d/8b/911d8b11-1655-c5b8-0a8e-377fe19efd70/mzaf_9541482921443729890.plus.aac.p.m4a'
    },
    {
        id: '3',
        title: 'Slight Heat of Espresso',
        artist: 'FM STAR',
        category: 'lofi',
        duration: '0:30',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/ec/c1/98ecc1f9-23a1-31b9-c1fe-e6e1b76c2798/4550752634924_cover.png/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4a/a5/c5/4aa5c560-805f-aafc-7f35-d91c2e7b68e2/mzaf_15892337998873191136.plus.aac.p.m4a'
    },
    {
        id: '4',
        title: 'Power',
        artist: 'Little Mix',
        category: 'energetic',
        duration: '0:30',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/62/a1/1e/62a11e38-a0e9-1c3d-ede1-ce7dd815158f/886446834702.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/8e/9e/9d/8e9e9d7c-846a-87a5-cbb3-7c75803d99cc/mzaf_6922150513725578586.plus.aac.p.m4a'
    },
    {
        id: '5',
        title: 'As It Was',
        artist: 'Harry Styles',
        category: 'viral',
        duration: '0:30',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a'
    },
    {
        id: '6',
        title: 'Time (Inception)',
        artist: 'Hans Zimmer',
        category: 'cinematic',
        duration: '0:40',
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/9f/7e/60/9f7e6017-3bd3-570f-7890-eba0f3aa6c33/mzi.hxbvposl.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/94/9c/89/949c8995-41f8-d3c1-90eb-81c10b54133b/mzaf_8252792899119007978.plus.aac.p.m4a'
    },
];

interface MusicSelectorProps {
    selectedTrackId: string | null;
    onSelect: (track: MusicTrack) => void;
}

export default function MusicSelector({ selectedTrackId, onSelect }: MusicSelectorProps) {
    const [playing, setPlaying] = useState<string | null>(null);
    const [category, setCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initial load of trending music
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults(TRENDING_MUSIC);
        }
    }, [searchQuery]);

    // Search handler
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=12`);
            const data = await response.json();

            const tracks: MusicTrack[] = data.results.map((item: any) => ({
                id: item.trackId.toString(),
                title: item.trackName,
                artist: item.artistName,
                category: item.primaryGenreName.toLowerCase().includes('pop') ? 'viral' : 'cinematic',
                duration: '0:30', // Previews are usually 30s
                cover: item.artworkUrl100.replace('100x100', '300x300'),
                previewUrl: item.previewUrl
            }));

            setSearchResults(tracks);
            setCategory('search');
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const togglePlay = (e: React.MouseEvent, track: MusicTrack) => {
        e.stopPropagation();

        if (playing === track.id) {
            audioRef.current?.pause();
            setPlaying(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = track.previewUrl;
                audioRef.current.play().catch(e => console.error("Audio play failed", e));
                setPlaying(track.id);
            }
        }
    };

    // Stop audio when component unmounts
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const filteredMusic = category === 'all' || category === 'search'
        ? searchResults
        : searchResults.filter(t => t.category === category);

    return (
        <div className="space-y-6">
            <audio ref={audioRef} onEnded={() => setPlaying(null)} />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Musique (Préécoute 🎧)
                    </label>

                    {/* Categories */}
                    <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
                        {MUSIC_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    setCategory(cat.id);
                                    setSearchQuery('');
                                    if (cat.id !== 'all') setSearchResults(TRENDING_MUSIC);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${category === cat.id
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une musique (ex: Viral TikTok, Sad, Epic...)"
                        className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {isSearching ? '...' : 'Chercher'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredMusic.map((track) => (
                    <div
                        key={track.id}
                        onClick={() => onSelect(track)}
                        className={`relative group cursor-pointer p-3 rounded-xl border transition-all duration-300 flex items-center space-x-3 overflow-hidden ${selectedTrackId === track.id
                            ? 'snake-border shadow-md'
                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                            }`}
                    >
                        {/* Cover + Play Button */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 shadow-sm z-10">
                            <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                            <button
                                onClick={(e) => togglePlay(e, track)}
                                className={`absolute inset-0 flex items-center justify-center transition-all ${playing === track.id ? 'bg-black/50 opacity-100' : 'bg-black/30 opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                {playing === track.id ? (
                                    <span className="text-white text-base">⏸</span>
                                ) : (
                                    <span className="text-white text-base">▶</span>
                                )}
                            </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 z-10">
                            <h4 className={`text-sm font-bold truncate ${selectedTrackId === track.id ? 'text-purple-900' : 'text-gray-900'}`}>
                                {track.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="truncate">{track.artist}</span>
                                <span className="bg-gray-100 px-1.5 rounded text-[10px] uppercase font-bold tracking-wider">{track.category}</span>
                            </div>
                        </div>

                        {/* Visualizer (Fake) if playing */}
                        {playing === track.id && (
                            <div className="flex items-end gap-0.5 h-4 mb-2 z-10">
                                <div className="w-1 bg-purple-500 animate-[bounce_1s_infinite] h-2"></div>
                                <div className="w-1 bg-purple-500 animate-[bounce_1.2s_infinite] h-4"></div>
                                <div className="w-1 bg-purple-500 animate-[bounce_0.8s_infinite] h-3"></div>
                            </div>
                        )}

                        {/* Selected Indicator */}
                        {selectedTrackId === track.id && !playing && (
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

