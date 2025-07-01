import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Text,
    Image,
    ActivityIndicator,
    ScrollView,
    Switch,
    PanResponder,
    Dimensions
} from 'react-native';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import { NavigationProps, Design, ImageProcessingOptions } from '../types';
import { COLORS, FONT, SIZES } from '../constants/theme';
import { DesignManager } from '../utils/designManager';
import { AIImageProcessor, ProcessingOptions, ProcessingResult } from '../utils/aiImageProcessor';
import { AI_CONFIG, AI_PROCESSING_DEFAULTS } from '../constants/aiConfig';

// Import camera and image processing modules
let CameraView: any;
let useCameraPermissions: any;
let ImageManipulator: any;
let FileSystem: any;

try {
    const cameraModule = require('expo-camera');
    CameraView = cameraModule.CameraView;
    useCameraPermissions = cameraModule.useCameraPermissions;

    ImageManipulator = require('expo-image-manipulator');
    FileSystem = require('expo-file-system');
} catch (error) {
    console.log('Camera/ImageManipulator modules not available');
}

const DesignCaptureScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
    const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => { }];
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTakingPhoto, setIsTakingPhoto] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [showCropControls, setShowCropControls] = useState(false);
    const [showProcessingOptions, setShowProcessingOptions] = useState(false);
    const [isAIAvailable, setIsAIAvailable] = useState(false);
    const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
    const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const cropAreaRef = useRef({ x: 50, y: 50, width: 200, height: 200 });
    const initialTouchRef = useRef({ x: 0, y: 0 });
    const dragStartCropRef = useRef({ x: 50, y: 50, width: 200, height: 200 });
    const imageLayoutRef = useRef({ width: 0, height: 0, x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);

    // AI Processing options with defaults
    const [aiOptions, setAiOptions] = useState<ProcessingOptions>({
        ...AI_PROCESSING_DEFAULTS,
        useAI: true,
    });

    const cameraRef = useRef<any>(null);

    // Check AI availability on component mount
    useEffect(() => {
        checkAIAvailability();
        initializeAI();
    }, []);

    // Keep refs in sync with state
    useEffect(() => {
        cropAreaRef.current = { ...cropArea };
        // Only update dragStartCropRef when not actively dragging
        if (!isDragging) {
            dragStartCropRef.current = { ...cropArea };
        }
    }, [cropArea, isDragging]);

    // Keep imageLayoutRef in sync with imageLayout state
    useEffect(() => {
        imageLayoutRef.current = { ...imageLayout };
    }, [imageLayout]);

    const checkAIAvailability = () => {
        const hasAnyAPIKey = Boolean(AI_CONFIG.codiaAI || AI_CONFIG.removeBG || AI_CONFIG.clipdrop || AI_CONFIG.huggingFace);
        setIsAIAvailable(hasAnyAPIKey);

        if (!hasAnyAPIKey) {
            console.log('⚠️ No AI API keys configured. Using local processing only.');
        } else {
            console.log('🤖 AI services available!');
        }
    };

    const initializeAI = () => {
        // Initialize AI services with API keys and CPU mode support
        AIImageProcessor.setAPIKeys({
            codiaAI: AI_CONFIG.codiaAI,
            removeBG: AI_CONFIG.removeBG,
            clipdrop: AI_CONFIG.clipdrop,
            huggingFace: AI_CONFIG.huggingFace,
        }, aiOptions.useCPUMode);
    };

    const takePicture = async () => {
        if (!cameraRef.current || isTakingPhoto) return;

        setIsTakingPhoto(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            setCapturedImage(photo.uri);
            setShowCropControls(true); // Show crop controls instead of processing options
        } catch (error: any) {
            Alert.alert('Error', 'Failed to take picture: ' + error.message);
        } finally {
            setIsTakingPhoto(false);
        }
    };

    // Pan responder for crop area dragging
    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
            setIsDragging(true);
            // Get the most current crop position from state using a callback and store it as drag start position
            setCropArea(currentCrop => {
                dragStartCropRef.current = { ...currentCrop };
                cropAreaRef.current = { ...currentCrop };
                console.log(`🤚 Started dragging crop area at (${dragStartCropRef.current.x}, ${dragStartCropRef.current.y})`);
                return currentCrop;
            });
            initialTouchRef.current = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        },
        onPanResponderMove: (event, gestureState) => {
            const { dx, dy } = gestureState;

            // Calculate new position based on drag start position + gesture movement
            const newX = dragStartCropRef.current.x + dx;
            const newY = dragStartCropRef.current.y + dy;

            // Use imageLayoutRef for reliable access during gestures
            const currentImageLayout = imageLayoutRef.current.width > 0 ? imageLayoutRef.current : { width: 337, height: 300 };

            // Apply bounds checking
            const maxX = currentImageLayout.width - dragStartCropRef.current.width;
            const maxY = currentImageLayout.height - dragStartCropRef.current.height;

            const constrainedX = Math.max(0, Math.min(maxX, newX));
            const constrainedY = Math.max(0, Math.min(maxY, newY));

            console.log(`📍 Moving crop to (${Math.round(constrainedX)}, ${Math.round(constrainedY)}) | Layout: ${currentImageLayout.width}x${currentImageLayout.height}`);

            setCropArea(prev => ({
                ...prev,
                x: constrainedX,
                y: constrainedY
            }));
        },
        onPanResponderRelease: () => {
            console.log('✋ Released crop area');
            setIsDragging(false);
            // Update all refs with the final position using a callback
            setCropArea(currentCropArea => {
                cropAreaRef.current = { ...currentCropArea };
                dragStartCropRef.current = { ...currentCropArea };
                console.log(`✅ Final crop position: (${Math.round(currentCropArea.x)}, ${Math.round(currentCropArea.y)})`);
                return currentCropArea;
            });
        },
    })).current;

    // Create resize pan responder for corner handles
    const createResizePanResponder = (corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (event) => {
                setIsResizing(true);
                setIsDragging(false); // Don't move while resizing
                setCropArea(currentCrop => {
                    dragStartCropRef.current = { ...currentCrop };
                    console.log(`🔍 Started resizing from ${corner} at ${Math.round(currentCrop.width)}×${Math.round(currentCrop.height)}`);
                    return currentCrop;
                });
            },
            onPanResponderMove: (event, gestureState) => {
                const currentImageLayout = imageLayoutRef.current.width > 0 ? imageLayoutRef.current : { width: 337, height: 300 };

                const { dx, dy } = gestureState;
                const startCrop = dragStartCropRef.current;

                // Calculate the desired new size based on gesture
                let desiredWidth;
                switch (corner) {
                    case 'topLeft':
                    case 'bottomLeft':
                        desiredWidth = startCrop.width - dx;
                        break;
                    case 'topRight':
                    case 'bottomRight':
                        desiredWidth = startCrop.width + dx;
                        break;
                }

                // Apply size constraints
                const minSize = 50;
                const maxSize = Math.min(currentImageLayout.width, currentImageLayout.height); // Full picture size
                const constrainedWidth = Math.max(minSize, Math.min(maxSize, desiredWidth));
                const constrainedHeight = constrainedWidth; // Keep square

                // Calculate position based on which corner is being dragged
                let newX = startCrop.x;
                let newY = startCrop.y;

                switch (corner) {
                    case 'topLeft':
                        // Anchor bottom-right corner
                        newX = startCrop.x + startCrop.width - constrainedWidth;
                        newY = startCrop.y + startCrop.height - constrainedHeight;
                        break;
                    case 'topRight':
                        // Anchor bottom-left corner
                        newX = startCrop.x;
                        newY = startCrop.y + startCrop.height - constrainedHeight;
                        break;
                    case 'bottomLeft':
                        // Anchor top-right corner
                        newX = startCrop.x + startCrop.width - constrainedWidth;
                        newY = startCrop.y;
                        break;
                    case 'bottomRight':
                        // Anchor top-left corner
                        newX = startCrop.x;
                        newY = startCrop.y;
                        break;
                }

                // Ensure the entire crop area stays within image bounds
                newX = Math.max(0, Math.min(currentImageLayout.width - constrainedWidth, newX));
                newY = Math.max(0, Math.min(currentImageLayout.height - constrainedHeight, newY));

                console.log(`🔍 Resizing ${corner}: ${Math.round(startCrop.width)}→${Math.round(constrainedWidth)} | Delta: ${Math.round(dx)} | Desired: ${Math.round(desiredWidth)} | Pos: (${Math.round(newX)}, ${Math.round(newY)})`);

                setCropArea(prev => ({
                    ...prev,
                    x: newX,
                    y: newY,
                    width: constrainedWidth,
                    height: constrainedHeight
                }));
            },
            onPanResponderRelease: () => {
                console.log('🔍 Finished resizing');
                setIsResizing(false);
                setCropArea(currentCrop => {
                    dragStartCropRef.current = { ...currentCrop };
                    console.log(`✅ Final crop size: ${Math.round(currentCrop.width)}×${Math.round(currentCrop.height)}`);
                    return currentCrop;
                });
            },
        });
    };

    // Create individual pan responders for each corner
    const topLeftResize = useRef(createResizePanResponder('topLeft')).current;
    const topRightResize = useRef(createResizePanResponder('topRight')).current;
    const bottomLeftResize = useRef(createResizePanResponder('bottomLeft')).current;
    const bottomRightResize = useRef(createResizePanResponder('bottomRight')).current;

    // Initialize crop area when image is captured
    const initializeCropArea = (layout: { width: number; height: number }) => {
        // Ensure layout dimensions are valid
        if (layout.width <= 0 || layout.height <= 0) {
            console.log('⚠️ Invalid layout dimensions, skipping crop initialization');
            return;
        }

        const minDimension = Math.min(layout.width, layout.height);
        const cropSize = Math.floor(minDimension * 0.7); // Slightly smaller for better UX
        const x = Math.floor((layout.width - cropSize) / 2);
        const y = Math.floor((layout.height - cropSize) / 2);

        const newCropArea = { x, y, width: cropSize, height: cropSize };

        console.log(`🔲 Initializing crop area: ${cropSize}x${cropSize} at (${x}, ${y}) in ${layout.width}x${layout.height} image`);

        // Update both state and all refs
        setCropArea(newCropArea);
        cropAreaRef.current = newCropArea;
        dragStartCropRef.current = newCropArea;

        const newImageLayout = { ...layout, x: 0, y: 0 };
        setImageLayout(newImageLayout);
        imageLayoutRef.current = newImageLayout;
    };

    const cropImage = async () => {
        if (!capturedImage || !ImageManipulator) return;

        setIsCropping(true);
        try {
            console.log('🔲 Cropping image with manual selection...');

            // Get the captured image dimensions
            const imageInfo = await ImageManipulator.manipulateAsync(
                capturedImage,
                [],
                { format: ImageManipulator.SaveFormat.JPEG }
            );

            // Calculate scale factors between display and actual image
            const scaleX = imageInfo.width / imageLayout.width;
            const scaleY = imageInfo.height / imageLayout.height;

            // Apply crop based on user selection
            const cropConfig = {
                originX: Math.round(cropArea.x * scaleX),
                originY: Math.round(cropArea.y * scaleY),
                width: Math.round(cropArea.width * scaleX),
                height: Math.round(cropArea.height * scaleY),
            };

            const croppedResult = await ImageManipulator.manipulateAsync(
                capturedImage,
                [
                    { crop: cropConfig },
                    { resize: { width: 512, height: 512 } }, // Optimal size for AI processing
                ],
                {
                    compress: 0.9,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            setCroppedImage(croppedResult.uri);
            setShowCropControls(false);
            setShowProcessingOptions(true);

            console.log(`✅ Manual crop applied: ${cropConfig.width}x${cropConfig.height} → 512x512`);

        } catch (error: any) {
            console.error('❌ Cropping failed:', error);
            Alert.alert('Cropping Error', 'Failed to crop image: ' + error.message);
        } finally {
            setIsCropping(false);
        }
    };

    const skipCrop = () => {
        // Skip cropping and use original image
        setCroppedImage(capturedImage);
        setShowCropControls(false);
        setShowProcessingOptions(true);
    };

    const resetCropArea = () => {
        // Reset crop area to center if it gets stuck
        if (imageLayout.width > 0 && imageLayout.height > 0) {
            initializeCropArea({ width: imageLayout.width, height: imageLayout.height });
            console.log('🔄 Crop area reset to center');
        }
    };



    const processImageToTattooStyle = async () => {
        const imageToProcess = croppedImage || capturedImage;
        if (!imageToProcess) return;

        setIsProcessing(true);
        try {
            console.log('🚀 Starting AI-powered tattoo design processing...');
            console.log(`📸 Processing ${croppedImage ? 'cropped' : 'original'} image: ${imageToProcess}`);

            const result: ProcessingResult = await AIImageProcessor.processImageToTattooDesign(
                imageToProcess,
                aiOptions
            );

            if (result.success && result.processedImageUri) {
                setProcessedImage(result.processedImageUri);

                // Show detailed success message
                const stepsText = result.processingSteps.join(' → ');
                console.log(`✅ Processing complete: ${stepsText}`);

                const alertTitle = isAIAvailable && aiOptions.useAI
                    ? 'AI Processing Complete! 🤖'
                    : 'Processing Complete! ✨';

                const alertMessage = isAIAvailable && aiOptions.useAI
                    ? `Your image has been intelligently processed using AI:\n\n${result.processingSteps.map(step => `• ${step}`).join('\n')}\n\nThe design is now optimized for tattoo use!`
                    : `Your image has been processed:\n\n${result.processingSteps.map(step => `• ${step}`).join('\n')}`;

                Alert.alert(alertTitle, alertMessage, [{ text: 'Great!', style: 'default' }]);
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (error: any) {
            console.error('Processing error:', error);
            Alert.alert(
                'Processing Error',
                `Failed to process image: ${error.message}\n\nPlease try again or check your settings.`
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const saveDesign = async () => {
        if (!processedImage) return;

        try {
            const designId = `user_${Date.now()}`;
            const designName = `AI Design ${new Date().toLocaleDateString()}`;

            const newDesign: Design = {
                id: designId,
                name: designName,
                uri: processedImage,
                category: 'Custom',
                isUserGenerated: true,
                originalImageUri: capturedImage!,
                createdAt: new Date(),
            };

            await DesignManager.saveCustomDesign(newDesign);

            navigation.navigate('VirtualTryOn', {
                customDesign: {
                    id: newDesign.id,
                    name: newDesign.name,
                    uri: newDesign.uri,
                    category: newDesign.category,
                    isUserGenerated: newDesign.isUserGenerated,
                    originalImageUri: newDesign.originalImageUri,
                }
            });

        } catch (error: any) {
            Alert.alert('Error', 'Failed to save design: ' + error.message);
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setCroppedImage(null);
        setProcessedImage(null);
        setShowCropControls(false);
        setShowProcessingOptions(false);
    };

    const updateAIOption = (option: keyof ProcessingOptions, value: boolean | string) => {
        setAiOptions(prev => ({
            ...prev,
            [option]: value
        }));
    };

    // Camera not available fallback
    if (!CameraView) {
        return (
            <View style={styles.container}>
                <Header title="Design Capture" showBack onBack={() => navigation.goBack()} />
                <View style={styles.fallbackContainer}>
                    <Text style={styles.fallbackText}>Camera not available</Text>
                    <Text style={styles.fallbackSubtext}>
                        This feature requires camera access to capture design photos
                    </Text>
                </View>
            </View>
        );
    }

    // Permission handling
    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Header title="Camera Permission" />
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>We need camera access to capture tattoo designs</Text>
                    <CustomButton
                        title="Grant Permission"
                        onPress={requestPermission}
                        style={styles.permissionButton}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Capture Design" />

            {!capturedImage ? (
                <View style={styles.cameraContainer}>
                    {CameraView && (
                        <CameraView
                            style={styles.camera}
                            ref={cameraRef}
                            facing="back"
                        />
                    )}

                    <View style={styles.cameraControls}>
                        <TouchableOpacity
                            style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
                            onPress={takePicture}
                            disabled={isTakingPhoto}
                        >
                            {isTakingPhoto ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.captureButtonText}>📷</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* AI Status Indicator */}
                    <View style={styles.aiStatusContainer}>
                        <Text style={[styles.aiStatusText, { color: isAIAvailable ? COLORS.primary : COLORS.gray }]}>
                            {isAIAvailable ? '🤖 AI Enhanced Processing' : '⚡ Local Processing'}
                        </Text>
                    </View>
                </View>
            ) : (
                <ScrollView style={styles.processContainer}>
                    {/* Manual Crop Interface */}
                    {showCropControls ? (
                        <View style={styles.cropContainer}>
                            <Text style={styles.sectionTitle}>✂️ Adjust Crop Area</Text>
                            <Text style={styles.cropDescription}>
                                Tap and drag the circular handle in the crop area to move it around.
                                Position it over the part of your image you want to process.
                                {'\n'}💡 Tip: The AI works best with tattoo designs centered in the crop area.
                            </Text>

                            {(isDragging || isResizing) && (
                                <Text style={styles.debugText}>
                                    {isResizing ? '🔍 Resizing' : '🎯 Dragging'}: ({Math.round(cropArea.x)}, {Math.round(cropArea.y)}) | Size: {Math.round(cropArea.width)}x{Math.round(cropArea.height)}
                                </Text>
                            )}

                            <Text style={styles.debugText}>
                                📐 Image: {imageLayout.width}x{imageLayout.height} | Crop: ({Math.round(cropArea.x)}, {Math.round(cropArea.y)}) {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
                            </Text>

                            <View style={styles.cropImageContainer}>
                                <Image
                                    source={{ uri: capturedImage }}
                                    style={styles.cropImage}
                                    onLayout={(event) => {
                                        const { width, height } = event.nativeEvent.layout;
                                        initializeCropArea({ width, height });
                                    }}
                                />

                                {/* Crop Overlay */}
                                <View style={styles.cropOverlay}>
                                    {/* Dark overlay covering the non-cropped areas */}
                                    <View style={[styles.overlaySection, {
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: cropArea.y
                                    }]} />
                                    <View style={[styles.overlaySection, {
                                        top: cropArea.y + cropArea.height,
                                        left: 0,
                                        right: 0,
                                        bottom: 0
                                    }]} />
                                    <View style={[styles.overlaySection, {
                                        top: cropArea.y,
                                        left: 0,
                                        width: cropArea.x,
                                        height: cropArea.height
                                    }]} />
                                    <View style={[styles.overlaySection, {
                                        top: cropArea.y,
                                        left: cropArea.x + cropArea.width,
                                        right: 0,
                                        height: cropArea.height
                                    }]} />

                                    {/* Crop area container */}
                                    <View
                                        style={[styles.cropArea, {
                                            left: cropArea.x,
                                            top: cropArea.y,
                                            width: cropArea.width,
                                            height: cropArea.height,
                                            backgroundColor: (isDragging || isResizing) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        }]}
                                    >
                                        <View style={styles.cropBorder} />

                                        {/* Main draggable area (center) - only responds if not resizing */}
                                        {!isResizing && (
                                            <View
                                                style={styles.cropDragArea}
                                                {...panResponder.panHandlers}
                                            >
                                                <Text style={styles.cropTouchText}>
                                                    {isDragging ? '✋' : '🤚'}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Corner resize handles with individual pan responders */}
                                        <View
                                            style={[styles.resizeHandle, styles.topLeftHandle]}
                                            {...topLeftResize.panHandlers}
                                        />
                                        <View
                                            style={[styles.resizeHandle, styles.topRightHandle]}
                                            {...topRightResize.panHandlers}
                                        />
                                        <View
                                            style={[styles.resizeHandle, styles.bottomLeftHandle]}
                                            {...bottomLeftResize.panHandlers}
                                        />
                                        <View
                                            style={[styles.resizeHandle, styles.bottomRightHandle]}
                                            {...bottomRightResize.panHandlers}
                                        />

                                        {/* Size info */}
                                        <View style={styles.sizeInfoContainer}>
                                            <Text style={styles.sizeInfoText}>
                                                {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
                                                {isResizing ? ' ↔️' : isDragging ? ' 🤚' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cropButtonRow}>
                                <CustomButton
                                    title={isCropping ? "Applying..." : "✅ Apply Crop"}
                                    onPress={cropImage}
                                    disabled={isCropping}
                                    style={[styles.cropButton, styles.cropAutoButton]}
                                />
                                <CustomButton
                                    title="➡️ Skip Crop"
                                    onPress={skipCrop}
                                    disabled={isCropping}
                                    style={[styles.cropButton, styles.skipCropButton]}
                                />
                            </View>
                            <Text style={styles.cropInstructions}>
                                💡 Drag the crop area to move it around{'\n'}
                                🔍 Drag the corner handles to resize it{'\n'}
                                🔄 Reset if needed
                            </Text>

                            <View style={styles.cropSecondaryButtonRow}>
                                <CustomButton
                                    title="🔄 Reset Position"
                                    onPress={resetCropArea}
                                    disabled={isCropping}
                                    style={styles.resetCropButton}
                                />
                            </View>

                            {isCropping && (
                                <View style={styles.processingIndicator}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                    <Text style={styles.cropProgressText}>Applying crop selection...</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        /* Show captured image after cropping */
                        <View style={styles.imagePreview}>
                            <Text style={styles.sectionTitle}>
                                {croppedImage ? 'Cropped Image' : 'Captured Image'}
                            </Text>
                            <Image source={{ uri: croppedImage || capturedImage }} style={styles.previewImage} />
                        </View>
                    )}



                    {/* AI Processing Options */}
                    {showProcessingOptions && (
                        <View style={styles.optionsContainer}>
                            <Text style={styles.sectionTitle}>
                                {isAIAvailable ? '🤖 AI Processing Options' : '⚡ Processing Options'}
                            </Text>

                            {isAIAvailable && (
                                <View style={styles.optionRow}>
                                    <Text style={styles.optionLabel}>Use AI Processing</Text>
                                    <Switch
                                        value={aiOptions.useAI}
                                        onValueChange={(value) => updateAIOption('useAI', value)}
                                        trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                                    />
                                </View>
                            )}

                            <View style={styles.optionRow}>
                                <Text style={styles.optionLabel}>Remove Background</Text>
                                <Switch
                                    value={aiOptions.removeBackground}
                                    onValueChange={(value) => updateAIOption('removeBackground', value)}
                                    trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                                />
                            </View>

                            <View style={styles.optionRow}>
                                <Text style={styles.optionLabel}>Convert to Line Art</Text>
                                <Switch
                                    value={aiOptions.convertToLineArt}
                                    onValueChange={(value) => updateAIOption('convertToLineArt', value)}
                                    trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                                />
                            </View>

                            <View style={styles.optionRow}>
                                <Text style={styles.optionLabel}>Enhance Edges</Text>
                                <Switch
                                    value={aiOptions.enhanceEdges}
                                    onValueChange={(value) => updateAIOption('enhanceEdges', value)}
                                    trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                                />
                            </View>

                            <View style={styles.optionRow}>
                                <Text style={styles.optionLabel}>Smart Crop</Text>
                                <Switch
                                    value={aiOptions.smartCrop}
                                    onValueChange={(value) => updateAIOption('smartCrop', value)}
                                    trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                                />
                            </View>

                            {isAIAvailable && aiOptions.useAI && (
                                <View style={styles.optionRow}>
                                    <Text style={styles.optionLabel}>Output as SVG</Text>
                                    <Switch
                                        value={aiOptions.outputFormat === 'SVG'}
                                        onValueChange={(value) => updateAIOption('outputFormat', value ? 'SVG' : 'PNG')}
                                        trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Process Button */}
                    <CustomButton
                        title={isProcessing ? "Processing..." : "🎨 Create Tattoo Design"}
                        onPress={processImageToTattooStyle}
                        disabled={isProcessing}
                        style={styles.processButton}
                    />

                    {isProcessing && (
                        <View style={styles.processingIndicator}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.processingText}>
                                {isAIAvailable && aiOptions.useAI
                                    ? 'AI is analyzing and processing your image...'
                                    : 'Processing your image...'}
                            </Text>
                        </View>
                    )}

                    {/* Processed Image */}
                    {processedImage && (
                        <View style={styles.imagePreview}>
                            <Text style={styles.sectionTitle}>Processed Design</Text>
                            <Image source={{ uri: processedImage }} style={styles.previewImage} />

                            <View style={styles.buttonRow}>
                                <CustomButton
                                    title="💾 Save Design"
                                    onPress={saveDesign}
                                    style={[styles.actionButton, styles.saveButton]}
                                />
                                <CustomButton
                                    title="📷 Retake"
                                    onPress={retakePhoto}
                                    style={[styles.actionButton, styles.retakeButton]}
                                />
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    captureButtonDisabled: {
        backgroundColor: COLORS.gray,
    },
    captureButtonText: {
        fontSize: 30,
        color: COLORS.white,
    },
    aiStatusContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    aiStatusText: {
        fontSize: 14,
        fontFamily: FONT.medium,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    processContainer: {
        flex: 1,
        padding: 20,
    },
    imagePreview: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONT.bold,
        color: COLORS.primary,
        marginBottom: 10,
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: 10,
        resizeMode: 'contain',
        backgroundColor: COLORS.lightGray,
    },
    optionsContainer: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    optionLabel: {
        fontSize: 16,
        fontFamily: FONT.regular,
        color: COLORS.darkGray,
        flex: 1,
    },
    processButton: {
        marginBottom: 20,
    },
    processingIndicator: {
        alignItems: 'center',
        marginBottom: 20,
    },
    processingText: {
        marginTop: 10,
        fontSize: 14,
        fontFamily: FONT.medium,
        color: COLORS.primary,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    actionButton: {
        flex: 0.48,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    retakeButton: {
        backgroundColor: COLORS.gray,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        fontSize: 16,
        fontFamily: FONT.regular,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        minWidth: 200,
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    fallbackText: {
        color: COLORS.white,
        fontFamily: FONT.bold,
        fontSize: SIZES.h3,
        marginBottom: SIZES.base,
        textAlign: 'center',
    },
    fallbackSubtext: {
        color: COLORS.gray,
        fontFamily: FONT.regular,
        fontSize: SIZES.body3,
        textAlign: 'center',
    },
    // Crop-related styles
    cropContainer: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    cropDescription: {
        fontSize: 14,
        fontFamily: FONT.regular,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: 15,
    },
    cropInstructions: {
        fontSize: 12,
        fontFamily: FONT.regular,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginVertical: 10,
        lineHeight: 18,
    },
    cropButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cropButton: {
        flex: 0.48,
    },
    cropAutoButton: {
        backgroundColor: COLORS.primary,
    },
    skipCropButton: {
        backgroundColor: COLORS.gray,
    },
    cropSecondaryButtonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    resetCropButton: {
        backgroundColor: COLORS.darkGray,
        minWidth: 150,
    },
    manualControlsContainer: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
    },
    manualControlsTitle: {
        fontSize: 14,
        fontFamily: FONT.medium,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginBottom: 8,
    },
    manualControlsGrid: {
        alignItems: 'center',
    },
    manualControlRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    manualControlButton: {
        backgroundColor: COLORS.primary,
        minWidth: 40,
        minHeight: 40,
        marginHorizontal: 4,
        borderRadius: 20,
    },
    controlSectionTitle: {
        fontSize: 12,
        fontFamily: FONT.medium,
        color: COLORS.darkGray,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    resizeControlRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 8,
    },
    resizeButton: {
        flex: 0.45,
        minHeight: 36,
    },
    smallerButton: {
        backgroundColor: COLORS.gray,
    },
    biggerButton: {
        backgroundColor: COLORS.primary,
    },
    cropProgressText: {
        marginTop: 5,
        fontSize: 12,
        fontFamily: FONT.regular,
        color: COLORS.primary,
        textAlign: 'center',
    },
    // Manual crop styles
    cropImageContainer: {
        position: 'relative',
        marginBottom: 15,
        borderRadius: 10,
        overflow: 'hidden',
    },
    cropImage: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        backgroundColor: COLORS.lightGray,
    },
    cropOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    overlaySection: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cropArea: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
    },
    cropBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderWidth: 2,
        borderColor: COLORS.white,
        borderRadius: 4,
    },
    resizeHandle: {
        position: 'absolute',
        width: 24,
        height: 24,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    topLeftHandle: {
        top: -12,
        left: -12,
    },
    topRightHandle: {
        top: -12,
        right: -12,
    },
    bottomLeftHandle: {
        bottom: -12,
        left: -12,
    },
    bottomRightHandle: {
        bottom: -12,
        right: -12,
    },
    cropDragArea: {
        position: 'absolute',
        top: '20%',
        left: '20%',
        right: '20%',
        bottom: '20%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
    },
    cropTouchText: {
        fontSize: 16,
        color: COLORS.white,
    },
    sizeInfoContainer: {
        position: 'absolute',
        bottom: -25,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    sizeInfoText: {
        fontSize: 10,
        fontFamily: FONT.medium,
        color: COLORS.primary,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    debugText: {
        fontSize: 12,
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: FONT.medium,
    },
});

export default DesignCaptureScreen; 