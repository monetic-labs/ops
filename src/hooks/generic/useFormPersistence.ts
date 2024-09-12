import { useState, useEffect, useCallback } from "react";

export function useFormPersistence<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    const savedData = localStorage.getItem(key);

    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  const updateData = useCallback((newData: Partial<T>) => {
    setData((prevData) => ({ ...prevData, ...newData }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  }, [key, initialData]);

  return { data, updateData, resetData };
}
