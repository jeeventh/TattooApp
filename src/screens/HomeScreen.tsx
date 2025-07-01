import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CustomButton from '../components/CustomButton';
import { NavigationProps } from '../types';
import { COLORS, FONT, SIZES } from '../constants/theme';

const HomeScreen: React.FC<NavigationProps> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="light" />
      <Text style={styles.title}>AI Tattoo Designer</Text>
      <Text style={styles.subtitle}>
        Design, visualize, and share your perfect tattoo
      </Text>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Capture Your Design"
          onPress={() => navigation.navigate('DesignCapture')}
        />
        <CustomButton
          title="Virtual Try-On"
          onPress={() => navigation.navigate('VirtualTryOn')}
        />
        <CustomButton
          title="Inspiration Gallery"
          onPress={() => navigation.navigate('Gallery')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h1,
    color: COLORS.white,
    fontFamily: FONT.bold,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
    fontFamily: FONT.regular,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default HomeScreen;
