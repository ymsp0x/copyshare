// project/src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import supabase

export function useCategories() {
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name') // Select only the 'name' column
          .order('name', { ascending: true }); // Order alphabetically

        if (error) {
          throw error;
        }

        // Map the fetched data to an array of strings (category names)
        const names = data ? data.map(cat => cat.name) : [];
        setCategoryNames(names);
      } catch (err: any) {
        console.error('Error fetching categories:', err.message);
        setError('Failed to fetch categories: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []); // Empty dependency array means this runs once on mount

  return { categoryNames, isLoading, error };
}