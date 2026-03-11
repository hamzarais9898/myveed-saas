'use client';

interface FormatSelectorProps {
    selectedFormat: 'youtube' | 'short' | 'both';
    onFormatChange: (format: 'youtube' | 'short' | 'both') => void;
}

export default function FormatSelector({ selectedFormat, onFormatChange }: FormatSelectorProps) {
    const formats = [
        {
            id: 'youtube',
            name: 'YouTube',
            ratio: '16:9',
            resolution: '1280x720',
            orientation: 'Horizontal',
            icon: '📺',
            description: 'Format paysage classique',
            color: 'from-red-500 to-red-600'
        },
        {
            id: 'short',
            name: 'Shorts / TikTok / Reels',
            ratio: '9:16',
            resolution: '720x1280',
            orientation: 'Vertical',
            icon: '📱',
            description: 'Format vertical mobile-first',
            color: 'from-pink-500 to-purple-600'
        },
        {
            id: 'both',
            name: 'Pack Viral (Both)',
            ratio: '16:9 + 9:16',
            resolution: '720p Dual',
            orientation: 'Mixte',
            icon: '🚀',
            description: 'Couverture maximale réseaux',
            color: 'from-blue-500 to-cyan-500'
        }
    ];

    return (
        <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                Format de destination
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {formats.map((format) => (
                    <button
                        key={format.id}
                        onClick={() => onFormatChange(format.id as any)}
                        className={`relative group p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${selectedFormat === format.id
                            ? 'border-transparent shadow-xl ring-2 ring-offset-2 ring-purple-200 scale-[1.02]'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg'
                            }`}
                    >
                        {/* Gradient Background when selected */}
                        {selectedFormat === format.id && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${format.color} opacity-10`} />
                        )}

                        <div className="relative z-10">
                            <div className={`text-4xl mb-3 transform transition-transform group-hover:scale-110 duration-300 ${selectedFormat === format.id ? 'scale-110' : ''}`}>
                                {format.icon}
                            </div>
                            <div className="font-black text-lg text-gray-900 mb-1">{format.name}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${selectedFormat === format.id ? 'bg-white/40 text-gray-900 border border-white/20' : 'bg-gray-100 text-gray-400'}`}>
                                    {format.ratio}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md opacity-70 ${selectedFormat === format.id ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {format.resolution}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md opacity-70 ${selectedFormat === format.id ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {format.orientation}
                                </span>
                            </div>
                        </div>

                        {/* Checkmark */}
                        {selectedFormat === format.id && (
                            <div className="absolute top-3 right-3 text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
