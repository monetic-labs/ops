import { useState, useEffect, useCallback } from "react";

export function useFormPersistence<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    const savedData = localStorage.getItem(key);
    console.log("savedData", savedData);

    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  const updateData = useCallback((newData: Partial<T>) => {
    setData((prevData) => {
      const updatedData = { ...prevData, ...newData };
      return updatedData;
    });
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
    console.log("resetData called", key);
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
      console.log("resetData removed", key);
    }
  }, [key, initialData]);

  return { data, updateData, resetData };
}
