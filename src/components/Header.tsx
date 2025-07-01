import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

// Try to import LinearGradient and Ionicons, fallback if not available
let LinearGradient: any;
let Ionicons: any;
try {
  const gradientModule = require('expo-linear-gradient');
  LinearGradient = gradientModule.LinearGradient;
} catch (error) {
  console.log('LinearGradient not available, using fallback');
  LinearGradient = View;
}

try {
  const iconsModule = require('@expo/vector-icons');
  Ionicons = iconsModule.Ionicons;
} catch (error) {
  console.log('Ionicons not available, using fallback');
  Ionicons = ({ name, size, color, style }: any) => (
    <Text style={[{ fontSize: size, color }, style]}>←</Text>
  );
}

import { HeaderProps } from '../types';
import { COLORS, FONT, SIZES } from '../constants/theme';

const Header: React.FC<HeaderProps> = ({ title, showBack = false, onBack }) => {
  const GradientComponent = LinearGradient || View;
  const gradientProps = LinearGradient ? {
    colors: [COLORS.primary, COLORS.secondary]
  } : {
    style: {
      backgroundColor: COLORS.primary
    }
  };

  return (
    <GradientComponent
      {...gradientProps}
      style={styles.header}
    >
      <SafeAreaView>
        <View style={styles.headerContent}>
          {showBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          {showBack && <View style={styles.placeholder} />}
        </View>
      </SafeAreaView>
    </GradientComponent>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomLeftRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.h2,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: SIZES.base,
  },
  placeholder: {
    width: 40,
  },
});

export default Header;
