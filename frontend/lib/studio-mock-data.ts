export const MOCK_GENRES = [
  'Science-Fiction', 'Thriller', 'Drame', 'Horreur', 'Comédie', 'Cyberpunk', 'Fantasy', 'Romance', 'Action'
];

export const MOCK_TONES = [
  'Sombre', 'Épique', 'Comique', 'Intense', 'Mélancolique', 'Mystérieux', 'Tendu'
];

export const MOCK_FORMATS = [
  { id: '9:16', label: 'Vertical (TikTok/Reels)', icon: 'smartphone' },
  { id: '16:9', label: 'Horizontal (YouTube/Cinéma)', icon: 'monitor' },
];

export const MOCK_SEASON = {
    id: "s_12345",
    title: "Néon Rouge",
    pitch: "Dans un Paris cyberpunk de 2084, une détective augmentée enquête sur des meurtres liés à une nouvelle drogue numérique corporelle.",
    visualStyle: "Cyberpunk, Néon, Pluie constante, Contraste fort, Granuleux",
    worldRules: "La cybernétique est contrôlée par l'État. L'eau potable est devenue rare. La drogue 'RedStream' permet de vivre les souvenirs des autres.",
    format: "Extralarge (16:9)",
    characters: [
        { name: "Kaelen", role: "Détective Augmentée", description: "Froide, analytique, cache une addiction." },
        { name: "Sylas", role: "Hacker / Informateur", description: "Paranoïaque, vit dans les bas-fonds, génie." }
    ],
    episodes: [
        {
            id: "ep_1",
            number: 1,
            title: "Injection Initiale",
            summary: "Kaelen découvre le premier corps aux yeux brûlés sur les quais de Seine. Les preuves l'orientent vers le secteur 4.",
            hook: "Un mort, mais son œil bionique continue d'enregistrer...",
            duration: "3min",
            status: "ready", // ready, generated
        },
        {
            id: "ep_2",
            number: 2,
            title: "Le Vendeur de Souvenirs",
            summary: "L'enquête mène Kaelen à un marché noir de mémoires. Elle doit consommer la drogue pour voir les derniers instants de la victime.",
            hook: "Plonger dans l'esprit d'un mort pour trouver le tueur.",
            duration: "4min",
            status: "draft"
        },
        {
            id: "ep_3",
            number: 3,
            title: "Surcharge Système",
            summary: "Le cartel du RedStream prend conscience de l'enquête et attaque l'appartement de Kaelen.",
            hook: "Quand le chasseur devient la proie dans un huis clos explosif.",
            duration: "3min30",
            status: "draft"
        },
        {
            id: "ep_4",
            number: 4,
            title: "Mémoire Effacée",
            summary: "Sylas trouve la source du code malveillant de la drogue, mais il est capturé.",
            hook: "Le seul homme détenant la vérité est effacé devant elle.",
            duration: "5min",
            status: "draft"
        },
        {
            id: "ep_5",
            number: 5,
            title: "L'Aube Rouge",
            summary: "L'affrontement final dans les serveurs centraux. Kaelen doit détruire la matrice du RedStream.",
            hook: "Détruire la matrice, quitte à perdre ses propres souvenirs.",
            duration: "6min",
            status: "draft"
        }
    ]
};

export const MOCK_SCENES_EP1 = [
    {
        id: "sc_1",
        number: 1,
        title: "Ouverture : Découverte",
        description: "Un plan large panoramique d'un quai de Seine sous une pluie battante et des néons violacés. Zoom sur le cadavre.",
        estimatedDuration: "15s",
        mood: "Sombre, mystérieux, froid",
        characters: ["Kaelen"],
        status: "ready" // ready, generating, done
    },
    {
        id: "sc_2",
        number: 2,
        title: "Examen de l'Oeil",
        description: "Plan très rapproché sur l'œil bionique de la victime qui continue de clignoter en rouge. Kaelen analyse le log.",
        estimatedDuration: "20s",
        mood: "Tendu, technologique",
        characters: ["Kaelen"],
        status: "ready"
    },
    {
        id: "sc_3",
        number: 3,
        title: "Appel au QG",
        description: "Kaelen s'éloigne du corps, la caméra la suit de dos tandis qu'elle contacte le QG par interface holographique.",
        estimatedDuration: "12s",
        mood: "Routine policière sombre",
        characters: ["Kaelen", "Voix QG"],
        status: "ready"
    }
];

export const MOCK_SHOTS_SC1 = [
    {
        id: "sh_1",
        name: "Plan d'ensemble ville",
        duration: "5s",
        prompt: "Wide establishing shot of a futuristic cyberpunk Paris, heavy rain, purple neon lights reflecting on the wet pavement of the Seine river banks. Cinematic lighting, 8k, photorealistic.",
        cameraAngle: "Wide Angle",
        cameraMovement: "Slow Pan Right",
        status: "done",
        thumbnail: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "sh_2",
        name: "Approche du corps",
        duration: "6s",
        prompt: "Medium shot tracking moving forward towards a person lying on the ground in a futuristic raincoat. Purple neon light hitting the wet coat. Cyberpunk aesthetic, cinematic.",
        cameraAngle: "Eye level",
        cameraMovement: "Dolly in",
        status: "generating",
        progress: 68,
        thumbnail: null
    },
    {
        id: "sh_3",
        name: "Gros plan visage",
        duration: "4s",
        prompt: "Extreme close up of a cyborg face lying on the wet ground. One robotic eye glowing faint red. Raindrops hitting the metallic parts of the face. Highly detailed.",
        cameraAngle: "Close up",
        cameraMovement: "Static",
        status: "pending",
        thumbnail: null
    },
    {
        id: "sh_4",
        name: "Arrivée Kaelen",
        duration: "5s",
        prompt: "Low angle shot of female cyberpunk detective 'Kaelen' stepping into the frame, combat boots splashing in a puddle. Dark trench coat. Moody lighting.",
        cameraAngle: "Low Angle",
        cameraMovement: "Tilt up",
        status: "failed",
        thumbnail: null
    }
];
