import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Text } from 'react-native';
import { SvgUri } from 'react-native-svg';
import Header from '../components/Header';
import { NavigationProps, Design } from '../types';
import { DESIGNS } from '../constants/designs';
import { COLORS, SIZES, FONT } from '../constants/theme';

// Try to import Ionicons, fallback if not available
let Ionicons: any;
try {
  const iconsModule = require('@expo/vector-icons');
  Ionicons = iconsModule.Ionicons;
} catch (error) {
  console.log('Ionicons not available, using fallback');
  Ionicons = ({ name, size, color, style }: any) => (
    <Text style={[{ fontSize: size, color }, style]}>🔍</Text>
  );
}

const GalleryScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(DESIGNS.map(design => design.category).filter(Boolean))];
    return cats as string[];
  }, []);

  const filteredDesigns = useMemo(() => {
    return DESIGNS.filter(design => {
      const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || design.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const renderDesign = ({ item }: { item: Design }) => (
    <TouchableOpacity style={styles.designContainer}>
      <SvgUri uri={item.uri} width="100%" height="80%" />
      <Text style={styles.designName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCategory = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.selectedCategoryText
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Inspiration Gallery" 
        showBack 
        onBack={() => navigation.goBack()} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search designs..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => renderCategory(item)}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredDesigns}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        renderItem={renderDesign}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  searchContainer: {
    padding: SIZES.padding,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
  },
  searchIcon: {
    marginRight: SIZES.base,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontFamily: FONT.regular,
    fontSize: SIZES.body3,
    paddingVertical: SIZES.padding,
  },
  categoriesContainer: {
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.base,
  },
  categoriesList: {
    paddingRight: SIZES.padding,
  },
  categoryButton: {
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    marginRight: SIZES.base,
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.gray,
    fontFamily: FONT.medium,
    fontSize: SIZES.body4,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SIZES.padding,
  },
  designContainer: {
    flex: 1,
    margin: SIZES.base,
    aspectRatio: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    padding: SIZES.base,
  },
  designName: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.body4,
    textAlign: 'center',
    marginTop: SIZES.base,
  },
});

export default GalleryScreen;
