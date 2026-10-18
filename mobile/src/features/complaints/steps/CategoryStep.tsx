import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES, CategoryItem } from '../../../constants';
import { useReportStore } from '../reportStore';
import { spacing, colors, typography } from '../../../theme';

interface CategoryStepProps {
  onNext: () => void;
}

export default function CategoryStep({ onNext }: CategoryStepProps) {
  const { category, setCategory } = useReportStore();

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    onNext();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>What's the issue?</Text>
        <Text style={styles.subtitle}>Select a category that best describes the problem</Text>
      </View>

      <View style={styles.grid}>
        {CATEGORIES.map((cat: CategoryItem) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryCard,
              category === cat.value && styles.categoryCardSelected,
            ]}
            onPress={() => handleCategorySelect(cat.value)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={(cat.icon as any) || 'alert-circle'}
                size={32}
                color={category === cat.value ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={styles.categoryDescription}>{cat.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    ...typography.bodyBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});