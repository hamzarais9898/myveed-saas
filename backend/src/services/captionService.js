/**
 * Caption Service
 * Generate and style auto captions
 */

// 30 Caption Style Templates
const CAPTION_STYLES = [
  {
    id: 1,
    name: "Subtitles model 1",
    font: "Montserrat",
    weight: "bold",
    fontSize: 48,
    color: "#FFFFFF",
    backgroundColor: "#000000",
    backgroundOpacity: 0.8,
    position: "bottom-center",
    animation: "fade-in",
    outline: true,
    outlineColor: "#000000",
    outlineWidth: 3,
    shadow: true,
    shadowColor: "#000000",
    shadowBlur: 10,
    uppercase: false,
    padding: 20
  },
  {
    id: 2,
    name: "Subtitles model 2",
    font: "Impact",
    weight: "bold",
    fontSize: 52,
    color: "#FFFF00",
    backgroundColor: "transparent",
    position: "top-center",
    animation: "bounce",
    outline: true,
    outlineColor: "#000000",
    outlineWidth: 4,
    shadow: false,
    uppercase: true,
    padding: 15
  },
  {
    id: 3,
    name: "Subtitles model 3",
    font: "Arial",
    weight: "bold",
    fontSize: 44,
    color: "#FF6B6B",
    backgroundColor: "#FFFFFF",
    backgroundOpacity: 0.9,
    position: "bottom-center",
    animation: "slide-up",
    outline: false,
    shadow: true,
    shadowColor: "#000000",
    shadowBlur: 8,
    uppercase: false,
    padding: 18
  },
  {
    id: 4,
    name: "Subtitles model 4",
    font: "Bebas Neue",
    weight: "regular",
    fontSize: 56,
    color: "#00D9FF",
    backgroundColor: "transparent",
    position: "center",
    animation: "typewriter",
    outline: true,
    outlineColor: "#000000",
    outlineWidth: 5,
    shadow: true,
    shadowColor: "#0066CC",
    shadowBlur: 15,
    uppercase: true,
    padding: 0
  },
  {
    id: 5,
    name: "Subtitles model 5",
    font: "Roboto",
    weight: "bold",
    fontSize: 46,
    color: "#FFFFFF",
    backgroundColor: "#8B00FF",
    backgroundOpacity: 0.7,
    position: "bottom-center",
    animation: "fade-in",
    outline: false,
    shadow: true,
    shadowColor: "#000000",
    shadowBlur: 12,
    uppercase: false,
    padding: 22
  },
  // Add 25 more styles...
  {
    id: 6,
    name: "Subtitles model 6",
    font: "Poppins",
    weight: "bold",
    fontSize: 50,
    color: "#FF1493",
    backgroundColor: "transparent",
    position: "bottom-center",
    animation: "pop",
    outline: true,
    outlineColor: "#FFFFFF",
    outlineWidth: 3,
    shadow: true,
    shadowColor: "#000000",
    shadowBlur: 10,
    uppercase: false,
    padding: 16
  },
  // ... continuing with more styles up to 30
  {
    id: 30,
    name: "Subtitles model 30",
    font: "Comic Sans MS",
    weight: "bold",
    fontSize: 48,
    color: "#FFD700",
    backgroundColor: "#FF4500",
    backgroundOpacity: 0.85,
    position: "top-center",
    animation: "wiggle",
    outline: true,
    outlineColor: "#000000",
    outlineWidth: 4,
    shadow: true,
    shadowColor: "#8B0000",
    shadowBlur: 15,
    uppercase: true,
    padding: 20
  }
];

// Fill in remaining styles (7-29) with variations
for (let i = 7; i <= 29; i++) {
  CAPTION_STYLES.push({
    id: i,
    name: `Subtitles model ${i}`,
    font: ["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman"][i % 5],
    weight: i % 2 === 0 ? "bold" : "regular",
    fontSize: 40 + (i % 10) * 2,
    color: ["#FFFFFF", "#FFFF00", "#FF6B6B", "#00D9FF", "#FF1493"][i % 5],
    backgroundColor: i % 3 === 0 ? "transparent" : ["#000000", "#8B00FF", "#FF4500"][i % 3],
    backgroundOpacity: 0.7 + (i % 3) * 0.1,
    position: ["bottom-center", "top-center", "center"][i % 3],
    animation: ["fade-in", "slide-up", "bounce", "pop"][i % 4],
    outline: i % 2 === 0,
    outlineColor: "#000000",
    outlineWidth: 2 + (i % 3),
    shadow: i % 3 !== 0,
    shadowColor: "#000000",
    shadowBlur: 8 + (i % 5),
    uppercase: i % 4 === 0,
    padding: 15 + (i % 8)
  });
}

/**
 * Get all caption styles
 */
exports.getCaptionStyles = () => {
  return CAPTION_STYLES;
};

/**
 * Get caption style by ID
 */
exports.getCaptionStyleById = (styleId) => {
  return CAPTION_STYLES.find(style => style.id === parseInt(styleId));
};

/**
 * Generate captions with style
 * @param {Array} transcript - Array of { start, end, text }
 * @param {number} styleId - Caption style ID
 * @returns {Array} - Styled captions
 */
exports.generateCaptions = (transcript, styleId = 1) => {
  try {
    const style = exports.getCaptionStyleById(styleId);
    if (!style) {
      throw new Error(`Caption style ${styleId} not found`);
    }

    const captions = transcript.map(segment => ({
      start: segment.start,
      end: segment.end,
      text: style.uppercase ? segment.text.toUpperCase() : segment.text,
      style: {
        font: style.font,
        weight: style.weight,
        fontSize: style.fontSize,
        color: style.color,
        backgroundColor: style.backgroundColor,
        backgroundOpacity: style.backgroundOpacity,
        position: style.position,
        animation: style.animation,
        outline: style.outline,
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
        shadow: style.shadow,
        shadowColor: style.shadowColor,
        shadowBlur: style.shadowBlur,
        padding: style.padding
      }
    }));

    console.log(`Generated ${captions.length} captions with style ${styleId}`);
    return captions;

  } catch (error) {
    console.error('Caption generation error:', error);
    throw new Error('Failed to generate captions: ' + error.message);
  }
};

/**
 * Apply caption animation
 */
exports.applyCaptionAnimation = (captions, animationType) => {
  const animations = {
    'fade-in': { duration: 0.3, easing: 'ease-in' },
    'slide-up': { duration: 0.4, easing: 'ease-out', translateY: 20 },
    'bounce': { duration: 0.5, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
    'pop': { duration: 0.3, easing: 'ease-out', scale: 1.2 },
    'typewriter': { duration: 0.05, perCharacter: true },
    'wiggle': { duration: 0.2, rotation: 5 }
  };

  return captions.map(caption => ({
    ...caption,
    animation: animations[animationType] || animations['fade-in']
  }));
};
