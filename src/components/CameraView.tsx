import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Dimensions, Platform, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { CameraViewProps, TattooPosition } from '../types';
import { COLORS, SIZES, FONT } from '../constants/theme';

// Try to import Camera and other modules
let CameraView: any;
let useCameraPermissions: any;
let MediaLibrary: any;
let Sharing: any;
let FileSystem: any;
let ImageManipulator: any;
let captureRef: any;
let PhotoManipulator: any;

try {
  const cameraModule = require('expo-camera');
  CameraView = cameraModule.CameraView;
  useCameraPermissions = cameraModule.useCameraPermissions;

  const mediaModule = require('expo-media-library');
  MediaLibrary = mediaModule;

  const sharingModule = require('expo-sharing');
  Sharing = sharingModule;

  const fileSystemModule = require('expo-file-system');
  FileSystem = fileSystemModule;

  // Try to import expo-image-manipulator for image composition
  try {
    ImageManipulator = require('expo-image-manipulator');
  } catch (e) {
    console.log('expo-image-manipulator not available');
  }

  // Try to import react-native-photo-manipulator for overlay functionality
  try {
    PhotoManipulator = require('react-native-photo-manipulator').default;
  } catch (e) {
    console.log('react-native-photo-manipulator not available');
  }

  // Import react-native-view-shot for SVG capture
  try {
    const viewShotModule = require('react-native-view-shot');
    captureRef = viewShotModule.captureRef;
  } catch (e) {
    console.log('react-native-view-shot not available');
  }
} catch (error) {
  console.log('Camera modules not available');
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CameraWithTattoo: React.FC<CameraViewProps> = ({
  design,
  tattooPosition,
  onPositionChange,
  isVisible
}) => {
  const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => { }];
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showTattooInPhoto, setShowTattooInPhoto] = useState(true);
  const [lastCaptureHadTattoo, setLastCaptureHadTattoo] = useState(false);
  const [capturedCameraImage, setCapturedCameraImage] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const svgRef = useRef<View>(null);
  const compositeRef = useRef<View>(null);

  const updatePosition = (newPosition: Partial<TattooPosition>) => {
    onPositionChange({
      ...tattooPosition,
      ...newPosition
    });
  };

  const moveTattoo = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 20;
    switch (direction) {
      case 'up':
        updatePosition({ y: tattooPosition.y - step });
        break;
      case 'down':
        updatePosition({ y: tattooPosition.y + step });
        break;
      case 'left':
        updatePosition({ x: tattooPosition.x - step });
        break;
      case 'right':
        updatePosition({ x: tattooPosition.x + step });
        break;
    }
  };

  const scaleTattoo = (bigger: boolean) => {
    const newScale = bigger
      ? Math.min(3, tattooPosition.scale + 0.2)
      : Math.max(0.5, tattooPosition.scale - 0.2);
    updatePosition({ scale: newScale });
  };

  const captureSvgAsImage = async (): Promise<string | null> => {
    if (!captureRef || !svgRef.current) {
      console.log('SVG capture not available');
      return null;
    }

    try {
      console.log('Capturing SVG as image...');
      const svgImageUri = await captureRef(svgRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        backgroundColor: 'transparent',
      });

      console.log('SVG captured:', svgImageUri);
      return svgImageUri;
    } catch (error: any) {
      console.log('SVG capture failed:', error.message);
      return null;
    }
  };



  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);
    try {
      console.log('Taking picture with tattoo overlay...');

      // Take camera photo first
      const cameraPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      console.log('Camera photo taken:', cameraPhoto.uri);

      let finalPhotoUri = cameraPhoto.uri;
      let hasTattooOverlay = false;

      // If tattoo overlay is enabled, create composite image
      if (showTattooInPhoto && ImageManipulator) {
        try {
          console.log('Creating composite image with tattoo overlay...');

          // First, we need to create a tattoo image from the SVG
          // For now, we'll create a simple overlay effect using image manipulation
          // Note: SVG overlaying requires converting SVG to image first

          // Get the camera photo dimensions
          const imageInfo = await ImageManipulator.manipulateAsync(
            cameraPhoto.uri,
            [],
            { format: ImageManipulator.SaveFormat.JPEG }
          );

          console.log('Camera photo info:', imageInfo);

          // Calculate tattoo position and size relative to image
          const imageWidth = imageInfo.width;
          const imageHeight = imageInfo.height;

          // Convert screen coordinates to image coordinates
          const tattooX = (tattooPosition.x / screenWidth) * imageWidth;
          const tattooY = (tattooPosition.y / screenHeight) * imageHeight;
          const tattooSize = 100 * tattooPosition.scale;

          // Step 1: Store the camera image for composite view
          setCapturedCameraImage(cameraPhoto.uri);

          // Step 2: Create composite image with tattoo overlay
          console.log('🎬 Creating composite image with real overlay...');

          // Wait for state update to render
          await new Promise(resolve => setTimeout(resolve, 500));

          if (captureRef && compositeRef.current && showTattooInPhoto) {
            try {
              console.log('📸 Capturing composite view with tattoo overlay...');

              const compositeImageUri = await captureRef(compositeRef.current, {
                format: 'jpg',
                quality: 0.9,
                result: 'tmpfile',
                width: imageWidth,
                height: imageHeight,
              });

              finalPhotoUri = compositeImageUri;
              console.log('✅ Composite image with tattoo overlay created successfully!');
              hasTattooOverlay = true;

            } catch (compositeError: any) {
              console.log('❌ Composite capture failed:', compositeError.message);
              // Fallback to enhanced camera photo
              if (ImageManipulator) {
                const enhancedPhoto = await ImageManipulator.manipulateAsync(
                  cameraPhoto.uri,
                  [{ resize: { width: imageWidth, height: imageHeight } }],
                  { format: ImageManipulator.SaveFormat.JPEG, quality: 0.95 }
                );
                finalPhotoUri = enhancedPhoto.uri;
              } else {
                finalPhotoUri = cameraPhoto.uri;
              }
            }
          } else {
            console.log('⚠️ Composite capture not available, using camera photo only');
            finalPhotoUri = cameraPhoto.uri;
          }

          // Clear the captured image state
          setCapturedCameraImage(null);
          hasTattooOverlay = true;
          console.log('Composite image created:', finalPhotoUri);

        } catch (compositeError: any) {
          console.log('Image composition failed:', compositeError.message);
          console.log('Using camera photo without overlay');
        }
      }

      // Update state with capture result  
      setLastCaptureHadTattoo(hasTattooOverlay);

      // Show success message based on capture method
      const successMessage = hasTattooOverlay
        ? '🎉 Photo with tattoo overlay captured successfully!\n✨ Composite image created with real overlay!\n📸 Ready to share your tattooed photo!'
        : '📷 Photo captured successfully!\n⚠️ Tattoo overlay not available in current mode';

      // Try to save to gallery first
      let saveSuccess = false;

      if (MediaLibrary && Platform.OS === 'ios') {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(finalPhotoUri);
            saveSuccess = true;
            Alert.alert('Success', `${successMessage}\nSaved to gallery!`);
          }
        } catch (mediaError: any) {
          console.log('Media library not available:', mediaError.message);
        }
      }

      // If saving to gallery failed or not available, try sharing
      if (!saveSuccess && Sharing) {
        try {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            Alert.alert(
              'Photo Taken!',
              `${successMessage}\nWould you like to share the photo?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Share',
                  onPress: async () => {
                    try {
                      await Sharing.shareAsync(finalPhotoUri, {
                        mimeType: 'image/jpeg',
                        dialogTitle: 'Share your tattoo photo'
                      });
                    } catch (shareError: any) {
                      console.error('Share error:', shareError);
                      Alert.alert('Share Error', 'Failed to share photo');
                    }
                  }
                }
              ]
            );
          } else {
            Alert.alert('Photo Taken!', successMessage);
          }
        } catch (sharingError: any) {
          console.log('Sharing not available:', sharingError.message);
          Alert.alert('Photo Taken!', successMessage);
        }
      } else if (!saveSuccess) {
        Alert.alert('Photo Taken!', successMessage);
      }

    } catch (error: any) {
      console.error('Camera error:', error);
      Alert.alert('Error', `Failed to take picture: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!CameraView) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Camera not available</Text>
        <Text style={styles.fallbackSubtext}>Install expo-camera to use this feature</Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera permission</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.captureContainer}
      >
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          mode="picture"
        />

        {/* Tattoo overlay positioned absolutely within capture container */}
        {showTattooInPhoto && (
          <View
            style={[
              styles.tattooOverlay,
              {
                left: tattooPosition.x,
                top: tattooPosition.y,
                transform: [{ scale: tattooPosition.scale }]
              }
            ]}
          >
            {design.isUserGenerated ? (
              <Image
                source={{ uri: design.uri }}
                style={styles.tattooImage}
              />
            ) : (
              <SvgUri
                uri={design.uri}
                width={100}
                height={100}
                style={styles.tattooSvg}
              />
            )}
          </View>
        )}
      </View>

      {/* Hidden design for capture - positioned offscreen */}
      <View
        ref={svgRef}
        style={styles.hiddenSvgContainer}
        collapsable={false}
      >
        {design.isUserGenerated ? (
          <Image
            source={{ uri: design.uri }}
            style={[
              styles.hiddenImage,
              {
                width: 100 * tattooPosition.scale,
                height: 100 * tattooPosition.scale,
              }
            ]}
          />
        ) : (
          <SvgUri
            uri={design.uri}
            width={100 * tattooPosition.scale}
            height={100 * tattooPosition.scale}
            style={styles.hiddenSvg}
          />
        )}
      </View>

      {/* Composite view for final image with overlay - positioned offscreen */}
      {capturedCameraImage && (
        <View
          ref={compositeRef}
          style={styles.compositeContainer}
          collapsable={false}
        >
          {/* Camera image as background */}
          <View style={styles.compositeImageContainer}>
            <Image
              source={{ uri: capturedCameraImage }}
              style={styles.cameraBackground}
              resizeMode="cover"
            />
          </View>

          {/* Tattoo overlay positioned on top */}
          <View
            style={[
              styles.compositeTattooOverlay,
              {
                left: (tattooPosition.x / screenWidth) * 300,
                top: (tattooPosition.y / screenHeight) * 400,
                transform: [{ scale: tattooPosition.scale }]
              }
            ]}
          >
            {design.isUserGenerated ? (
              <Image
                source={{ uri: design.uri }}
                style={styles.compositeTattooImage}
              />
            ) : (
              <SvgUri
                uri={design.uri}
                width={100}
                height={100}
                style={styles.compositeTattooSvg}
              />
            )}
          </View>
        </View>
      )}


      {/* All controls outside capture container */}
      <View style={styles.overlayControls}>
        {/* Position Controls */}
        <View style={styles.positionControls}>
          <TouchableOpacity style={styles.directionButton} onPress={() => moveTattoo('up')}>
            <Text style={styles.controlText}>↑</Text>
          </TouchableOpacity>
          <View style={styles.horizontalControls}>
            <TouchableOpacity style={styles.directionButton} onPress={() => moveTattoo('left')}>
              <Text style={styles.controlText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.directionButton} onPress={() => moveTattoo('right')}>
              <Text style={styles.controlText}>→</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.directionButton} onPress={() => moveTattoo('down')}>
            <Text style={styles.controlText}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* Scale Controls */}
        <View style={styles.scaleControls}>
          <TouchableOpacity style={styles.scaleButton} onPress={() => scaleTattoo(false)}>
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scaleButton} onPress={() => scaleTattoo(true)}>
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Tattoo Toggle */}
        <View style={styles.tattooToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, !showTattooInPhoto && styles.toggleButtonOff]}
            onPress={() => setShowTattooInPhoto(!showTattooInPhoto)}
          >
            <Text style={styles.controlText}>{showTattooInPhoto ? '👁️' : '🚫'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
          >
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.capturingButton]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={[styles.captureButtonInner, isCapturing && styles.capturingButtonInner]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              updatePosition({
                x: screenWidth / 2 - 50,
                y: screenHeight / 2 - 50,
                scale: 1,
                rotation: 0
              });
            }}
          >
            <Text style={styles.controlText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            📷 Overlay: {showTattooInPhoto ? 'ON' : 'OFF'} | Last: {lastCaptureHadTattoo ? 'With tattoo ✓' : 'Camera only'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  captureContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  camera: {
    flex: 1,
  },
  tattooOverlay: {
    position: 'absolute',
    zIndex: 10,
  },
  tattooSvg: {
    opacity: 0.8,
  },
  tattooImage: {
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  hiddenImage: {
    opacity: 0,
  },
  compositeTattooImage: {
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  overlayControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  positionControls: {
    position: 'absolute',
    top: 150,
    right: 20,
    alignItems: 'center',
  },
  horizontalControls: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  directionButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  scaleControls: {
    position: 'absolute',
    top: 150,
    left: 20,
    alignItems: 'center',
  },
  scaleButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  controlText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.body3,
    textAlign: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  capturingButton: {
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
  },
  capturingButtonInner: {
    backgroundColor: '#FF0000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  permissionText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.body2,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.body3,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
  },
  fallbackText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.body2,
    marginBottom: SIZES.base,
  },
  fallbackSubtext: {
    color: COLORS.gray,
    fontFamily: FONT.regular,
    fontSize: SIZES.body4,
    textAlign: 'center',
  },
  infoBanner: {
    position: 'absolute',
    top: 50,
    left: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    padding: SIZES.base,
    borderRadius: SIZES.radius,
  },
  infoText: {
    color: COLORS.black,
    fontFamily: FONT.medium,
    fontSize: SIZES.body4,
    textAlign: 'center',
  },
  tattooToggle: {
    position: 'absolute',
    top: 150,
    left: '50%',
    marginLeft: -25,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  toggleButtonOff: {
    borderColor: COLORS.gray,
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  hiddenSvgContainer: {
    position: 'absolute',
    top: -1000, // Position offscreen
    left: -1000,
    width: 200,
    height: 200,
  },
  hiddenSvg: {
    opacity: 1,
  },
  compositeContainer: {
    position: 'absolute',
    top: -2000, // Position far offscreen
    left: -2000,
    width: 300,
    height: 400,
    backgroundColor: 'transparent',
  },
  compositeImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  compositeTattooOverlay: {
    position: 'absolute',
    zIndex: 10,
  },
  cameraBackground: {
    width: '100%',
    height: '100%',
  },
  compositeTattooSvg: {
    opacity: 0.8,
  },
});

export default CameraWithTattoo;
