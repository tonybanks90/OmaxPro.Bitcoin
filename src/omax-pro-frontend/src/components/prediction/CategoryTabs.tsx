import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FactoryService, CATEGORY_MAP } from '../../services/factory-service';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch category counts from factory
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const counts = await FactoryService.getCategoryCounts();

        const mappedCategories: CategoryData[] = counts.map(({ category, count }) => {
          const meta = CATEGORY_MAP[category] || {
            name: category,
            icon: '📊',
            color: '#888888'
          };
          return {
            id: category.toLowerCase(),
            name: meta.name,
            icon: meta.icon,
            color: meta.color,
            count
          };
        });

        setCategories(mappedCategories);
        setTotalCount(mappedCategories.reduce((sum, cat) => sum + cat.count, 0));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    const interval = setInterval(fetchCategories, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const scrollContainer = (direction: 'left' | 'right') => {
    const container = document.getElementById('category-scroll');
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full py-2">
      {/* Mobile: horizontal scroll with arrows */}
      <div className="relative flex items-center">
        {/* Left scroll button - hidden on larger screens */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden absolute left-0 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur"
          onClick={() => scrollContainer('left')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Category buttons container */}
        <div
          id="category-scroll"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide px-8 md:px-0 md:flex-wrap"
        >
          {/* All button */}
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            onClick={() => onCategoryChange('all')}
            className="flex items-center space-x-1 whitespace-nowrap px-2 sm:px-3 py-1 h-8 text-xs sm:text-sm shrink-0"
            data-testid="category-all"
          >
            <span>All</span>
            <Badge variant="secondary" className="text-xs h-4 px-1 ml-1">
              {loading ? '...' : totalCount}
            </Badge>
          </Button>

          {/* Category buttons */}
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              onClick={() => onCategoryChange(category.id)}
              className="flex items-center space-x-1 whitespace-nowrap px-2 sm:px-3 py-1 h-8 text-xs sm:text-sm shrink-0"
              data-testid={`category-${category.id}`}
            >
              <span className="text-sm">{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
              <span className="sm:hidden">{category.name.slice(0, 4)}</span>
              <Badge
                variant="secondary"
                className="text-xs h-4 px-1 ml-1"
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

        {/* Right scroll button - hidden on larger screens */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden absolute right-0 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur"
          onClick={() => scrollContainer('right')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-xs text-muted-foreground text-center mt-2">
          Loading categories...
        </div>
      )}
    </div>
  );
}