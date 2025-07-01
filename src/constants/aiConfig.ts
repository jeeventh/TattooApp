// AI Service Configuration
// Add your API keys here for the different AI services

export interface AIConfig {
    codiaAI?: string;
    removeBG?: string;
    clipdrop?: string;
    huggingFace?: string; // For StarVector
}

// Default configuration - replace with your actual API keys
export const AI_CONFIG: AIConfig = {
    // Get your API key from: https://codia.ai/
    codiaAI: process.env.CODIA_AI_API_KEY || '',

    // Get your API key from: https://remove.bg/
    removeBG: process.env.REMOVE_BG_API_KEY || '',

    // Get your API key from: https://clipdrop.co/
    clipdrop: process.env.CLIPDROP_API_KEY || '',

    // Get your HuggingFace token from: https://huggingface.co/settings/tokens
    // Add your token to environment variables or directly here (not recommended for production)
    huggingFace: process.env.HUGGINGFACE_API_KEY || '',
};

// StarVector Configuration
export const STARVECTOR_CONFIG = {
    // Available StarVector models
    models: {
        '1b': 'starvector/starvector-1b-im2svg',
        '8b': 'starvector/starvector-8b-im2svg',
    },

    // Default model (1B is faster, 8B is more accurate)
    defaultModel: '1b' as '1b' | '8b',

    // Generation parameters
    generation: {
        temperature: 0.1,        // Low temperature for consistent results
        maxTokens: 2048,         // Enough for complex SVG
        doSample: true,
    },

    // Processing preferences
    preprocessing: {
        targetSize: 512,         // Optimal size for StarVector
        quality: 0.95,           // High quality for better SVG generation
        format: 'JPEG',
    },
};

// Free tier limits and alternative services
export const AI_ALTERNATIVES = {
    // Free alternatives when API keys are not available
    freeBackgroundRemoval: [
        'https://photoscissors.com/api',
        'https://pixcut.ai/api',
    ],
    freeSVGConverters: [
        'https://convertio.co/api',
        'https://cloudconvert.com/api',
    ],

    // StarVector alternatives
    starVectorAlternatives: [
        'Local StarVector-inspired processing',
        'Basic SVG generation',
    ],
};

// AI Processing preferences with StarVector
export const AI_PROCESSING_DEFAULTS = {
    useAI: true,
    removeBackground: true,
    enhanceEdges: true,
    convertToLineArt: true,
    autoContrast: true,
    smartCrop: true,
    outputFormat: 'SVG' as 'PNG' | 'SVG',
    preferSVG: true, // StarVector excels at SVG generation

    // StarVector specific options
    useStarVector: true,        // Prefer StarVector for SVG generation
    starVectorModel: '1b' as '1b' | '8b',
    fallbackToLocal: true,      // Use local processing if StarVector fails
    useCPUMode: false,          // Enable for local CPU testing (see CPU_SETUP_GUIDE.md)
};

// Performance settings
export const AI_PERFORMANCE = {
    maxImageSize: 512,          // Optimal for StarVector
    compressionQuality: 0.95,   // High quality for StarVector
    timeoutMs: 60000,          // 60 seconds for model inference
    retryAttempts: 2,

    // StarVector specific performance
    starVector: {
        maxTokens: 2048,
        batchSize: 1,
        memoryOptimization: true,
    },
}; 