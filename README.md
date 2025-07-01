# AI Tattoo Designer App

A React Native app built with Expo for designing and visualizing tattoos using AI.

## Setup Instructions

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npx expo start
   ```

3. **Run on specific platforms:**
   ```bash
   npx expo start --android
   npx expo start --ios
   npx expo start --web
   ```

## Features

### 🎨 AI-Powered Design Capture (NEW!)
- **🤖 Intelligent Subject Extraction**: AI automatically detects and extracts the main design from photos
- **🎯 Smart Background Removal**: Advanced algorithms remove cluttered backgrounds automatically  
- **✂️ Auto-Cropping**: Smart cropping focuses on the important parts of your design
- **🎨 Line Art Conversion**: Converts photos to clean, tattoo-ready line art style
- **💫 Tattoo Style Processing**: Optimizes contrast, edges, and formatting specifically for tattoo designs
- **👁️ Preview System**: See different processing styles before choosing your final design
- **💾 Persistent Storage**: Save your AI-processed designs for future use and sharing

### 🔍 Virtual Try-On Technology
- **Virtual tattoo try-on with live camera**: Use your device's camera to visualize tattoos on your body
- **Interactive Positioning**: Drag, scale, and rotate tattoo designs for perfect placement
- **Real-time tattoo positioning and scaling**: See how designs look on your skin in real-time
- **High-Quality Capture**: Take photos with tattoo overlays for sharing and decision-making

### 📱 Additional Features
- Design inspiration gallery
- AI-powered design generation
- Social sharing capabilities
- Search and category filtering
- Custom design management and storage
- AI-powered image processing and subject extraction

## 🤖 AI Processing Setup (Optional)

The app includes a powerful AI processing pipeline that works in multiple modes:

### **Local Processing (Default)**
- ✅ Works offline immediately
- ✅ No API keys required
- ✅ Privacy-focused (images never leave device)
- Uses on-device algorithms for background removal and styling

### **Cloud AI Enhancement (Optional)**
For even better results, you can enable cloud-based AI services:

#### **Remove.bg API Setup**
1. Sign up at [remove.bg](https://www.remove.bg/api)
2. Get your API key
3. Add to `src/utils/aiImageProcessor.ts`:
```typescript
// Uncomment and add your API key in tryRemoveBgAPI method
'X-Api-Key': 'YOUR_REMOVE_BG_API_KEY'
```

#### **ClipDrop API Setup** 
1. Sign up at [ClipDrop](https://clipdrop.co/apis)
2. Implement in the `tryClipDropAPI` method

### **Processing Modes Available**
- **🤖 AI Mode**: Full intelligent processing pipeline
- **👁️ Preview Mode**: Compare different processing styles
- **⚡ Basic Mode**: Simple optimization without AI

## Camera Functionality Limitations in Expo Go

⚠️ **Important**: The camera feature has limitations when running in Expo Go:

- **Gallery Save**: Cannot save photos directly to device gallery due to Android permission changes
- **Alternative**: Photos can be shared using the device's share menu
- **Full Functionality**: Create a development build for complete gallery access

### Creating a Development Build (Recommended for Camera Features)

1. **Install EAS CLI:**

   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configure EAS:**

   ```bash
   eas build:configure
   ```

3. **Build for Android:**

   ```bash
   eas build --platform android --profile development
   ```

4. **Build for iOS:**
   ```bash
   eas build --platform ios --profile development
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # App header component
│   ├── CustomButton.tsx # Custom button component
│   └── CameraView.tsx  # Camera with tattoo overlay
├── constants/          # App constants (theme, designs)
├── screens/           # App screens
│   ├── HomeScreen.tsx         # Main screen with navigation
│   ├── VirtualTryOnScreen.tsx # Virtual tattoo try-on
│   ├── GalleryScreen.tsx      # Design inspiration gallery
│   └── DesignCaptureScreen.tsx # NEW: AI-powered design capture
├── types/            # TypeScript type definitions
├── utils/           # NEW: Utility functions
│   ├── designManager.ts # Custom design storage management
│   └── aiImageProcessor.ts # NEW: AI image processing pipeline
└── assets/          # Images, fonts, etc.
```

## Technologies Used

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Camera
- Expo Image Manipulator (for design processing)
- Expo Linear Gradient
- React Native SVG
- AsyncStorage (for design persistence)
- React Native Photo Manipulator
- AI Image Processing Pipeline (background removal, line art conversion)
- Smart image analysis and subject detection

## Troubleshooting

If you encounter issues:

1. Clear the cache: `npx expo start --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Make sure you're using Node.js version 16 or higher
4. For camera issues in Expo Go, create a development build
5. For AI processing issues, check console logs for detailed error messages
