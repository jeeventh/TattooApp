import { Design } from '../types';

// Import AsyncStorage or use expo-storage
let AsyncStorage: any;
try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
    console.log('AsyncStorage not available, using memory storage');
}

const CUSTOM_DESIGNS_KEY = 'custom_tattoo_designs';

// In-memory fallback if AsyncStorage not available
let memoryStorage: Design[] = [];

export class DesignManager {
    /**
     * Save a custom design to storage
     */
    static async saveCustomDesign(design: Design): Promise<void> {
        try {
            const customDesigns = await this.getCustomDesigns();
            const updatedDesigns = [design, ...customDesigns];

            if (AsyncStorage) {
                await AsyncStorage.setItem(CUSTOM_DESIGNS_KEY, JSON.stringify(updatedDesigns));
            } else {
                memoryStorage = updatedDesigns;
            }

            console.log('Custom design saved successfully:', design.id);
        } catch (error) {
            console.error('Failed to save custom design:', error);
            throw new Error('Failed to save design');
        }
    }

    /**
     * Get all custom designs from storage
     */
    static async getCustomDesigns(): Promise<Design[]> {
        try {
            if (AsyncStorage) {
                const stored = await AsyncStorage.getItem(CUSTOM_DESIGNS_KEY);
                return stored ? JSON.parse(stored) : [];
            } else {
                return memoryStorage;
            }
        } catch (error) {
            console.error('Failed to get custom designs:', error);
            return [];
        }
    }

    /**
     * Delete a custom design by ID
     */
    static async deleteCustomDesign(designId: string): Promise<void> {
        try {
            const customDesigns = await this.getCustomDesigns();
            const updatedDesigns = customDesigns.filter(design => design.id !== designId);

            if (AsyncStorage) {
                await AsyncStorage.setItem(CUSTOM_DESIGNS_KEY, JSON.stringify(updatedDesigns));
            } else {
                memoryStorage = updatedDesigns;
            }

            console.log('Custom design deleted successfully:', designId);
        } catch (error) {
            console.error('Failed to delete custom design:', error);
            throw new Error('Failed to delete design');
        }
    }

    /**
     * Get a specific custom design by ID
     */
    static async getCustomDesign(designId: string): Promise<Design | null> {
        try {
            const customDesigns = await this.getCustomDesigns();
            return customDesigns.find(design => design.id === designId) || null;
        } catch (error) {
            console.error('Failed to get custom design:', error);
            return null;
        }
    }

    /**
     * Clear all custom designs (for reset/cleanup)
     */
    static async clearAllCustomDesigns(): Promise<void> {
        try {
            if (AsyncStorage) {
                await AsyncStorage.removeItem(CUSTOM_DESIGNS_KEY);
            } else {
                memoryStorage = [];
            }

            console.log('All custom designs cleared');
        } catch (error) {
            console.error('Failed to clear custom designs:', error);
            throw new Error('Failed to clear designs');
        }
    }

    /**
     * Get design statistics
     */
    static async getDesignStats(): Promise<{
        totalCustomDesigns: number;
        oldestDesign?: Date;
        newestDesign?: Date;
    }> {
        try {
            const customDesigns = await this.getCustomDesigns();

            if (customDesigns.length === 0) {
                return { totalCustomDesigns: 0 };
            }

            const dates = customDesigns
                .map(design => design.createdAt)
                .filter(date => date) as Date[];

            const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

            return {
                totalCustomDesigns: customDesigns.length,
                oldestDesign: sortedDates[0],
                newestDesign: sortedDates[sortedDates.length - 1],
            };
        } catch (error) {
            console.error('Failed to get design stats:', error);
            return { totalCustomDesigns: 0 };
        }
    }
} 