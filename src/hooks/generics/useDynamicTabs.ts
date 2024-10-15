import { useState, useCallback } from 'react';

export type TabData = {
  key: string;
  title: string;
  isCompleted: boolean;
  isActive?: boolean;
};

export function useDynamicTabs(initialTabs: TabData[]) {
  const [tabs, setTabs] = useState<TabData[]>(initialTabs);
  const [activeTab, setActiveTab] = useState<string>(initialTabs[0].key);

  const addTab = useCallback((newTab: TabData) => {
    setTabs(prevTabs => [...prevTabs, newTab]);
  }, []);

  const removeTabs = useCallback((tabKeysToRemove: string[]) => {
    setTabs(prevTabs => prevTabs.filter(tab => !tabKeysToRemove.includes(tab.key)));
  }, []);

  const updateTabCompletion = useCallback((tabKey: string, isCompleted: boolean) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.key === tabKey ? { ...tab, isCompleted } : tab
      )
    );
  }, []);

  const updateTabTitle = useCallback((tabKey: string, newTitle: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.key === tabKey ? { ...tab, title: newTitle } : tab
      )
    );
  }, []);

  return {
    tabs,
    activeTab,
    setActiveTab,
    updateTabCompletion,
    updateTabTitle,
    addTab,
    removeTabs,
  };
}