import React from 'react';
import type { PredictionCategory } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';

interface CategoryTabsProps {
  categories: PredictionCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full py-2">
      {/* All screens: single row without scroll, smaller elements */}
      <div className="flex items-center justify-start gap-1 sm:gap-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          onClick={() => onCategoryChange('all')}
          className="flex items-center space-x-1 whitespace-nowrap px-2 py-1 h-8 text-xs"
          data-testid="category-all"
        >
          <span>All</span>
          <Badge variant="secondary" className="text-xs h-4 px-1">
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </Badge>
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            onClick={() => onCategoryChange(category.id)}
            className="flex items-center space-x-1 whitespace-nowrap px-2 py-1 h-8 text-xs"
            data-testid={`category-${category.id}`}
          >
            <span className="text-sm">{category.icon}</span>
            <span className="hidden sm:inline">{category.name}</span>
            <span className="sm:hidden">{category.name.slice(0, 3)}</span>
            <Badge 
              variant="secondary" 
              className="text-xs h-4 px-1"
              style={{ 
                backgroundColor: category.color + '20',
                color: category.color 
              }}
            >
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
}