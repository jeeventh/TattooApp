import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import VirtualTryOnScreen from './src/screens/VirtualTryOnScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import DesignCaptureScreen from './src/screens/DesignCaptureScreen';

// Try to import splash screen, fallback if not available
let SplashScreen: any;
let useFonts: any;

try {
  SplashScreen = require('expo-splash-screen');
  const fontModule = require('expo-font');
  useFonts = fontModule.useFonts;
  SplashScreen.preventAutoHideAsync();
} catch (error) {
  console.log('Splash screen not available, continuing without it');
}

const Stack = createStackNavigator();

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Skip font loading for now to avoid crashes
        setFontsLoaded(true);

        // Simulate any other async operations
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error during app preparation:', e);
        // Ensure app continues even if there are errors
        setFontsLoaded(true);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      if (SplashScreen) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="VirtualTryOn" component={VirtualTryOnScreen} />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="DesignCapture" component={DesignCaptureScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </View>
  );
};

export default App;
