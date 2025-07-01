export interface Design {
  id: string;
  name: string;
  uri: string;
  category?: string;
  isUserGenerated?: boolean;
  originalImageUri?: string;
  createdAt?: Date;
}

export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route?: {
    params?: any;
  };
}

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export interface TattooPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CameraViewProps {
  design: Design;
  tattooPosition: TattooPosition;
  onPositionChange: (position: TattooPosition) => void;
  isVisible: boolean;
}

export interface DesignCaptureProps {
  onDesignCreated: (design: Design) => void;
  onClose: () => void;
}

export interface ImageProcessingOptions {
  contrast?: number;
  brightness?: number;
  blackAndWhite?: boolean;
  invertColors?: boolean;
  edgeDetection?: boolean;
}
