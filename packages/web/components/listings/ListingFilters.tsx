'use client';

// Filter Sidebar Component
// Enthält Filter für Kategorien, Typ, Suche
// Auf Mobile: Suche immer sichtbar, Typ & Kategorien collapsible

import { useState, useEffect } from 'react';
import { ListingCategory } from '@sharelocal/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ListingFilters {
  category?: ListingCategory[];
  type?: 'OFFER' | 'REQUEST';
  search?: string;
}

interface ListingFiltersProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
  resultCount?: number;
}

const categories: { value: ListingCategory; label: string }[] = [
  { value: 'TOOL', label: 'Werkzeug' },
  { value: 'PLANT', label: 'Pflanze' },
  { value: 'SKILL', label: 'Fähigkeit' },
  { value: 'PRODUCT', label: 'Produkt' },
  { value: 'TIME', label: 'Zeit' },
  { value: 'OTHER', label: 'Sonstiges' },
];

export function ListingFilters({ filters, onFiltersChange, resultCount }: ListingFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleCategoryToggle = (category: ListingCategory) => {
    const currentCategories = filters.category || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    onFiltersChange({
      ...filters,
      category: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleTypeChange = (type: 'OFFER' | 'REQUEST' | undefined) => {
    onFiltersChange({ ...filters, type });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.category?.length || filters.type || filters.search;

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Filter</CardTitle>
        <CardDescription>
          {resultCount !== undefined
            ? `${resultCount} ${resultCount === 1 ? 'Angebot' : 'Angebote'} gefunden`
            : 'Angebote filtern'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search - Always visible */}
        <div className="space-y-2">
          <Label htmlFor="search">Suche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nach Angeboten suchen..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchValue('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Type Filter - Collapsible on mobile */}
        <Collapsible open={isTypeOpen} onOpenChange={setIsTypeOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-normal lg:hidden"
            >
              <Label className="cursor-pointer">Typ</Label>
              {isTypeOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <div className="hidden lg:block">
            <Label>Typ</Label>
          </div>
          <CollapsibleContent className="lg:!block space-y-3">
            <div className="space-y-2 pt-2 lg:pt-0">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-all"
                  checked={!filters.type}
                  onCheckedChange={() => handleTypeChange(undefined)}
                />
                <Label htmlFor="type-all" className="font-normal cursor-pointer">
                  Beide
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-offer"
                  checked={filters.type === 'OFFER'}
                  onCheckedChange={(checked) => handleTypeChange(checked ? 'OFFER' : undefined)}
                />
                <Label htmlFor="type-offer" className="font-normal cursor-pointer">
                  Angebot
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-request"
                  checked={filters.type === 'REQUEST'}
                  onCheckedChange={(checked) => handleTypeChange(checked ? 'REQUEST' : undefined)}
                />
                <Label htmlFor="type-request" className="font-normal cursor-pointer">
                  Gesuch
                </Label>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Category Filter - Collapsible on mobile */}
        <Collapsible open={isCategoryOpen} onOpenChange={setIsCategoryOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-normal lg:hidden"
            >
              <Label className="cursor-pointer">Kategorien</Label>
              {isCategoryOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <div className="hidden lg:block">
            <Label>Kategorien</Label>
          </div>
          <CollapsibleContent className="lg:!block space-y-3">
            <div className="space-y-2 pt-2 lg:pt-0">
              {categories.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={filters.category?.includes(category.value) || false}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  />
                  <Label
                    htmlFor={`category-${category.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-2">
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              Filter zurücksetzen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

