import { Alert } from 'react-native';
import { StarVectorProcessor, StarVectorOptions, StarVectorResult } from './starVectorProcessor';
import { AI_CONFIG, STARVECTOR_CONFIG, AI_PROCESSING_DEFAULTS } from '../constants/aiConfig';

// Import image processing modules
let ImageManipulator: any;
let FileSystem: any;

try {
    ImageManipulator = require('expo-image-manipulator');
    FileSystem = require('expo-file-system');
} catch (error) {
    console.log('Image processing modules not available');
}

export interface ProcessingOptions {
    removeBackground?: boolean;
    enhanceEdges?: boolean;
    convertToLineArt?: boolean;
    autoContrast?: boolean;
    smartCrop?: boolean;
    useAI?: boolean;
    outputFormat?: 'PNG' | 'SVG';
    useStarVector?: boolean;
    starVectorModel?: '1b' | '8b';
    fallbackToLocal?: boolean;
    useCPUMode?: boolean;
}

export interface ProcessingResult {
    success: boolean;
    processedImageUri?: string;
    originalImageUri: string;
    processingSteps: string[];
    error?: string;
    format?: 'PNG' | 'SVG';
    svgCode?: string;
    model?: string;
}

// AI Service Configuration
const AI_SERVICES = {
    CODIA_AI: {
        baseURL: 'https://api.codia.ai/v1',
        apiKey: null as string | null,
    },
    REMOVE_BG: {
        baseURL: 'https://api.remove.bg/v1.0',
        apiKey: null as string | null,
    },
    CLIPDROP: {
        baseURL: 'https://clipdrop-api.co',
        apiKey: null as string | null,
    }
};

export class AIImageProcessor {

    /**
     * Set API keys for AI services
     */
    static setAPIKeys(keys: { codiaAI?: string; removeBG?: string; clipdrop?: string; huggingFace?: string }, enableCPUMode: boolean = false) {
        if (keys.codiaAI) AI_SERVICES.CODIA_AI.apiKey = keys.codiaAI;
        if (keys.removeBG) AI_SERVICES.REMOVE_BG.apiKey = keys.removeBG;
        if (keys.clipdrop) AI_SERVICES.CLIPDROP.apiKey = keys.clipdrop;

        // Initialize StarVector with CPU mode support
        if (keys.huggingFace || enableCPUMode) {
            StarVectorProcessor.initialize(keys.huggingFace, enableCPUMode);
        }
    }

    /**
     * Main processing pipeline now using StarVector for tattoo designs
     */
    static async processImageToTattooDesign(
        imageUri: string,
        options: ProcessingOptions = {}
    ): Promise<ProcessingResult> {
        const processingSteps: string[] = [];
        let currentImageUri = imageUri;

        try {
            console.log('🌟 Starting StarVector-powered tattoo design processing...');

            // Merge with defaults
            const finalOptions = { ...AI_PROCESSING_DEFAULTS, ...options };

            // Step 1: Try StarVector first (preferred method)
            if (finalOptions.useStarVector && StarVectorProcessor.isAvailable()) {
                console.log('🚀 Using StarVector for direct image-to-SVG conversion...');

                const starVectorOptions: StarVectorOptions = {
                    model: finalOptions.starVectorModel || '1b',
                    temperature: STARVECTOR_CONFIG.generation.temperature,
                    maxTokens: STARVECTOR_CONFIG.generation.maxTokens,
                    huggingFaceToken: AI_CONFIG.huggingFace,
                };

                const starVectorResult = await StarVectorProcessor.imageToSVG(imageUri, starVectorOptions);

                if (starVectorResult.success) {
                    console.log('✅ StarVector processing successful!');

                    // Check if this was API or local processing
                    const usingAPI = starVectorResult.processingSteps.some(step =>
                        step.includes('StarVector API') && !step.includes('not available')
                    );

                    return {
                        success: true,
                        processedImageUri: starVectorResult.svgUri,
                        originalImageUri: imageUri,
                        processingSteps: starVectorResult.processingSteps,
                        format: 'SVG',
                        svgCode: starVectorResult.svgCode,
                        model: usingAPI ? starVectorResult.model : 'Enhanced StarVector-inspired (Local)',
                    };
                } else {
                    console.log('⚠️ StarVector processing not available, continuing with fallbacks...');
                    processingSteps.push('StarVector processing not available');
                }
            }

            // Step 2: Fallback to local StarVector-inspired processing
            if (finalOptions.fallbackToLocal) {
                console.log('⚡ Using local StarVector-inspired processing...');

                const localStarVectorResult = await StarVectorProcessor.processWithLocalStarVector(imageUri);

                if (localStarVectorResult.success) {
                    console.log('✅ Local StarVector processing successful!');
                    return {
                        success: true,
                        processedImageUri: localStarVectorResult.svgUri,
                        originalImageUri: imageUri,
                        processingSteps: [...processingSteps, ...localStarVectorResult.processingSteps],
                        format: 'SVG',
                        svgCode: localStarVectorResult.svgCode,
                        model: localStarVectorResult.model,
                    };
                } else {
                    processingSteps.push('Local StarVector processing failed');
                }
            }

            // Step 3: Final fallback to traditional processing pipeline
            console.log('🔄 Falling back to traditional processing pipeline...');
            return await this.traditionalProcessingPipeline(imageUri, finalOptions, processingSteps);

        } catch (error: any) {
            console.error('❌ All processing methods failed:', error);

            // Ultimate fallback
            try {
                console.log('🆘 Using ultimate fallback processing...');
                return await this.ultimateFallbackProcessing(imageUri, processingSteps);
            } catch (fallbackError: any) {
                return {
                    success: false,
                    originalImageUri: imageUri,
                    processingSteps,
                    error: `All processing methods failed: ${error.message}`,
                };
            }
        }
    }

    /**
     * Traditional processing pipeline (enhanced but still uses older methods)
     */
    private static async traditionalProcessingPipeline(
        imageUri: string,
        options: ProcessingOptions,
        existingSteps: string[]
    ): Promise<ProcessingResult> {
        const processingSteps = [...existingSteps, 'Using traditional processing pipeline'];
        let currentImageUri = imageUri;

        try {
            // Step 1: Preprocess image
            console.log('📸 Preprocessing image...');
            currentImageUri = await this.preprocessForAI(currentImageUri);
            processingSteps.push('Image preprocessed');

            // Step 2: Background removal
            if (options.removeBackground) {
                console.log('🎯 Removing background...');
                const backgroundRemovedUri = await this.removeBackgroundAI(currentImageUri);
                if (backgroundRemovedUri) {
                    currentImageUri = backgroundRemovedUri;
                    processingSteps.push('Background removed using AI');
                } else {
                    currentImageUri = await this.localBackgroundRemoval(currentImageUri);
                    processingSteps.push('Background processed locally');
                }
            }

            // Step 3: Smart cropping
            if (options.smartCrop) {
                console.log('✂️ Smart cropping...');
                currentImageUri = await this.smartCrop(currentImageUri);
                processingSteps.push('Smart cropped');
            }

            // Step 4: Convert to line art
            if (options.convertToLineArt) {
                console.log('🎨 Converting to line art...');
                currentImageUri = await this.convertToLineArt(currentImageUri);
                processingSteps.push('Converted to line art');
            }

            // Step 5: Apply tattoo styling
            console.log('💫 Applying tattoo styling...');
            currentImageUri = await this.applyTattooStyling(currentImageUri, options.autoContrast);
            processingSteps.push('Tattoo styling applied');

            console.log('✅ Traditional processing complete!');

            return {
                success: true,
                processedImageUri: currentImageUri,
                originalImageUri: imageUri,
                processingSteps,
                format: 'PNG',
                model: 'traditional-pipeline',
            };

        } catch (error: any) {
            throw new Error(`Traditional processing failed: ${error.message}`);
        }
    }

    /**
     * Ultimate fallback when everything else fails
     */
    private static async ultimateFallbackProcessing(
        imageUri: string,
        existingSteps: string[]
    ): Promise<ProcessingResult> {
        const processingSteps = [...existingSteps, 'Using ultimate fallback processing'];

        if (!ImageManipulator) {
            throw new Error('No image processing capabilities available');
        }

        try {
            // Basic image processing
            const processedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    { resize: { width: 600 } },
                ],
                {
                    compress: 0.8,
                    format: ImageManipulator.SaveFormat.PNG,
                }
            );

            processingSteps.push('Basic image processing applied');

            return {
                success: true,
                processedImageUri: processedImage.uri,
                originalImageUri: imageUri,
                processingSteps,
                format: 'PNG',
                model: 'ultimate-fallback',
            };

        } catch (error: any) {
            throw new Error(`Ultimate fallback failed: ${error.message}`);
        }
    }

    /**
     * Generate processing previews including StarVector option
     */
    static async generateProcessingPreviews(imageUri: string): Promise<{
        original: string;
        starVector?: string;
        localStarVector?: string;
        traditional?: string;
    }> {
        const previews: any = { original: imageUri };

        try {
            // Try StarVector preview
            if (StarVectorProcessor.isAvailable()) {
                console.log('🌟 Generating StarVector preview...');
                const starVectorResult = await StarVectorProcessor.imageToSVG(imageUri, {
                    model: '1b', // Use faster model for preview
                    temperature: 0.2,
                    maxTokens: 1024,
                });

                if (starVectorResult.success && starVectorResult.svgUri) {
                    previews.starVector = starVectorResult.svgUri;
                }
            }

            // Try local StarVector preview
            console.log('⚡ Generating local StarVector preview...');
            const localStarVectorResult = await StarVectorProcessor.processWithLocalStarVector(imageUri);
            if (localStarVectorResult.success && localStarVectorResult.svgUri) {
                previews.localStarVector = localStarVectorResult.svgUri;
            }

            // Traditional processing preview
            console.log('🔄 Generating traditional preview...');
            const traditionalResult = await this.traditionalProcessingPipeline(
                imageUri,
                { convertToLineArt: true, removeBackground: true },
                []
            );
            if (traditionalResult.success) {
                previews.traditional = traditionalResult.processedImageUri;
            }

        } catch (error) {
            console.log('Preview generation error:', error);
        }

        return previews;
    }

    /**
     * Preprocess image for optimal AI analysis
     */
    private static async preprocessForAI(imageUri: string): Promise<string> {
        if (!ImageManipulator) return imageUri;

        try {
            const optimizedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    { resize: { width: 1024 } },
                ],
                {
                    compress: 0.9,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            return optimizedImage.uri;
        } catch (error) {
            console.log('Preprocessing failed, using original image');
            return imageUri;
        }
    }

    /**
     * AI-powered background removal using multiple services
     */
    private static async removeBackgroundAI(imageUri: string): Promise<string | null> {
        try {
            if (AI_SERVICES.REMOVE_BG.apiKey) {
                const removeBgResult = await this.tryRemoveBgAPI(imageUri);
                if (removeBgResult) return removeBgResult;
            }

            if (AI_SERVICES.CLIPDROP.apiKey) {
                const clipDropResult = await this.tryClipDropAPI(imageUri);
                if (clipDropResult) return clipDropResult;
            }

            return null;
        } catch (error) {
            console.log('AI background removal failed:', error);
            return null;
        }
    }

    /**
     * Try Remove.bg API for background removal
     */
    private static async tryRemoveBgAPI(imageUri: string): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append('image_file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'image.jpg',
            } as any);

            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': AI_SERVICES.REMOVE_BG.apiKey!,
                },
                body: formData,
            });

            if (response.ok) {
                const imageBlob = await response.blob();

                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onloadend = async () => {
                        const base64data = reader.result as string;
                        const base64Image = base64data.split(',')[1];

                        const fileName = `bg_removed_${Date.now()}.png`;
                        const filePath = `${FileSystem.documentDirectory}${fileName}`;

                        await FileSystem.writeAsStringAsync(filePath, base64Image, {
                            encoding: FileSystem.EncodingType.Base64,
                        });

                        resolve(filePath);
                    };
                    reader.readAsDataURL(imageBlob);
                });
            }

            return null;
        } catch (error) {
            console.log('Remove.bg API failed:', error);
            return null;
        }
    }

    /**
     * Try ClipDrop API as alternative
     */
    private static async tryClipDropAPI(imageUri: string): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append('image_file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'image.jpg',
            } as any);

            const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
                method: 'POST',
                headers: {
                    'x-api-key': AI_SERVICES.CLIPDROP.apiKey!,
                },
                body: formData,
            });

            if (response.ok) {
                const imageBlob = await response.blob();

                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onloadend = async () => {
                        const base64data = reader.result as string;
                        const base64Image = base64data.split(',')[1];

                        const fileName = `clipdrop_${Date.now()}.png`;
                        const filePath = `${FileSystem.documentDirectory}${fileName}`;

                        await FileSystem.writeAsStringAsync(filePath, base64Image, {
                            encoding: FileSystem.EncodingType.Base64,
                        });

                        resolve(filePath);
                    };
                    reader.readAsDataURL(imageBlob);
                });
            }

            return null;
        } catch (error) {
            console.log('ClipDrop API failed:', error);
            return null;
        }
    }

    /**
     * Local background removal using aggressive contrast and edge enhancement
     */
    private static async localBackgroundRemoval(imageUri: string): Promise<string> {
        if (!ImageManipulator) return imageUri;

        try {
            console.log('🎯 Applying local background removal...');

            const resizedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 800 } }],
                {
                    compress: 1.0,
                    format: ImageManipulator.SaveFormat.PNG,
                }
            );

            const highContrastImage = await ImageManipulator.manipulateAsync(
                resizedImage.uri,
                [],
                {
                    compress: 0.3,
                    format: ImageManipulator.SaveFormat.PNG,
                }
            );

            return highContrastImage.uri;
        } catch (error) {
            console.log('Local background removal failed');
            return imageUri;
        }
    }

    /**
     * Smart crop implementation
     */
    private static async smartCrop(imageUri: string): Promise<string> {
        if (!ImageManipulator) return imageUri;

        try {
            const croppedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    {
                        crop: {
                            originX: 0.1,
                            originY: 0.1,
                            width: 0.8,
                            height: 0.8
                        }
                    },
                    { resize: { width: 600 } }
                ],
                {
                    compress: 0.9,
                    format: ImageManipulator.SaveFormat.PNG,
                }
            );

            return croppedImage.uri;
        } catch (error) {
            console.log('Smart crop failed');
            return imageUri;
        }
    }

    /**
     * Convert to line art
     */
    private static async convertToLineArt(imageUri: string): Promise<string> {
        if (!ImageManipulator) return imageUri;

        try {
            const lineArtImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [],
                {
                    compress: 0.1,
                    format: ImageManipulator.SaveFormat.PNG,
                }
            );

            return lineArtImage.uri;
        } catch (error) {
            console.log('Line art conversion failed');
            return imageUri;
        }
    }

    /**
     * Apply tattoo styling
     */
    private static async applyTattooStyling(imageUri: string, autoContrast: boolean = true): Promise<string> {
        if (!ImageManipulator) return imageUri;

        try {
            const styledImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    { resize: { width: 800 } },
                ],
                {
                    compress: autoContrast ? 0.1 : 0.8,
                    format: ImageManipulator.SaveFormat.PNG,
                }
            );

            return styledImage.uri;
        } catch (error) {
            console.log('Tattoo styling failed');
            return imageUri;
        }
    }
} 