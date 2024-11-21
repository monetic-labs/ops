import { TabData, useDynamicTabs } from "../generics/useDynamicTabs";

export const useTabManagement = () => {
  const initialTabs: TabData[] = [
    { key: "company-account", title: "Company Account", isCompleted: false },
    { key: "company-details", title: "Company Details", isCompleted: false },
    { key: "account-users", title: "Account Users", isCompleted: false },
    { key: "user-details", title: "User Details", isCompleted: false },
    { key: "register-account", title: "Register Account", isCompleted: false },
  ];

  const {
    tabs,
    activeTab,
    setActiveTab,
    updateTabCompletion,
    updateTabTitle,
    addTab,
    removeTabs,
  } = useDynamicTabs(initialTabs);

  return {
    tabs,
    activeTab,
    setActiveTab,
    updateTabCompletion,
    updateTabTitle,
    addTab,
    removeTabs,
  };
};