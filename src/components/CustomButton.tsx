import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { CustomButtonProps } from '../types';
import { COLORS, FONT, SIZES } from '../constants/theme';

// Try to import LinearGradient, fallback to View if not available
let LinearGradient: any;
try {
  const gradientModule = require('expo-linear-gradient');
  LinearGradient = gradientModule.LinearGradient;
} catch (error) {
  console.log('LinearGradient not available, using fallback');
  LinearGradient = View;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false,
  style 
}) => {
  const GradientComponent = LinearGradient || View;
  const gradientProps = LinearGradient ? {
    colors: disabled ? [COLORS.gray, COLORS.darkGray] : [COLORS.primary, COLORS.secondary]
  } : {
    style: {
      backgroundColor: disabled ? COLORS.gray : COLORS.primary
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.button, style]}
      disabled={disabled || loading}
    >
      <GradientComponent
        {...gradientProps}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </GradientComponent>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '80%',
    marginTop: SIZES.padding,
  },
  gradient: {
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.body3,
  },
});

export default CustomButton;
