import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, Share, TouchableOpacity, Text, Dimensions, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import CameraWithTattoo from '../components/CameraView';
import { NavigationProps, Design, TattooPosition } from '../types';
import { DESIGNS } from '../constants/designs';
import { COLORS, FONT, SIZES } from '../constants/theme';

// Try to import expo-sharing, fallback to React Native Share
let Sharing: any;
try {
  Sharing = require('expo-sharing');
} catch (error) {
  console.log('Expo Sharing not available, using React Native Share');
  Sharing = null;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VirtualTryOnScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const [design, setDesign] = useState<Design>(DESIGNS[0]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tattooPosition, setTattooPosition] = useState<TattooPosition>({
    x: screenWidth / 2 - 50,
    y: screenHeight / 2 - 50,
    scale: 1,
    rotation: 0,
  });

  // Handle custom design from DesignCaptureScreen
  React.useEffect(() => {
    if (route?.params?.customDesign) {
      setDesign(route.params.customDesign);
    }
  }, [route?.params?.customDesign]);

  const generateDesign = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const randomDesign = DESIGNS[Math.floor(Math.random() * DESIGNS.length)];
      setDesign(randomDesign);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareDesign = async () => {
    setIsSharing(true);
    try {
      if (Sharing) {
        // Use expo-sharing if available
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Sharing Not Available', 'Sharing is not available on your platform');
          return;
        }
        await Sharing.shareAsync(design.uri, {
          dialogTitle: `Share ${design.name}`,
        });
      } else {
        // Fallback to React Native Share
        await Share.share({
          message: `Check out this awesome tattoo design: ${design.name}`,
          url: design.uri,
          title: `Share ${design.name}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share design. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <Header
          title="Virtual Try-On"
          showBack
          onBack={() => setShowCamera(false)}
        />
        <CameraWithTattoo
          design={design}
          tattooPosition={tattooPosition}
          onPositionChange={setTattooPosition}
          isVisible={showCamera}
        />
        <View style={styles.cameraInstructions}>
          <Text style={styles.instructionText}>
            Drag, pinch, and rotate to position your tattoo
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Virtual Try-On"
        showBack
        onBack={() => navigation.goBack()}
      />
      <View style={styles.contentContainer}>
        <View style={styles.designContainer}>
          {design.isUserGenerated ? (
            // Use Image component for user-generated PNG designs
            <Image
              source={{ uri: design.uri }}
              style={styles.designImage}
              resizeMode="contain"
              onError={() => Alert.alert('Error', 'Failed to load custom design')}
            />
          ) : (
            // Use SvgUri for predefined SVG designs
            <SvgUri
              uri={design.uri}
              width="100%"
              height="100%"
              onError={() => Alert.alert('Error', 'Failed to load design')}
            />
          )}
          {isGenerating && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Describe your tattoo..."
          placeholderTextColor={COLORS.gray}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
        />

        <CustomButton
          title="Generate Design"
          onPress={generateDesign}
          loading={isGenerating}
          disabled={!prompt.trim()}
        />

        <CustomButton
          title="Capture Custom Design"
          onPress={() => navigation.navigate('DesignCapture')}
        />

        <CustomButton
          title="Try on Camera"
          onPress={() => setShowCamera(true)}
        />

        <CustomButton
          title="Share Design"
          onPress={shareDesign}
          loading={isSharing}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  designContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    overflow: 'hidden',
    position: 'relative',
  },
  designImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.white,
    fontFamily: FONT.regular,
    fontSize: SIZES.body3,
    marginBottom: SIZES.padding,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  cameraInstructions: {
    position: 'absolute',
    top: 100,
    left: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  instructionText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.body4,
    textAlign: 'center',
  },
});

export default VirtualTryOnScreen;
