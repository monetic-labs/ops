import { useCallback } from 'react';
import { MentionOption } from '@/types/messaging';

export const useMentions = () => {
  const options: MentionOption[] = [
    {
      id: '1',
      value: 'bill-pay',
      label: 'Bill Pay',
      description: 'All the bill pay things',
      icon: '💰'
    },
    {
      id: '2',
      value: 'card-issuance',
      label: 'Card Issuance',
      description: 'All the card issuance things',
      icon: '💳'
    },
    {
      id: '3',
      value: 'back-office',
      label: 'Back Office',
      description: 'All the back office things',
      icon: '💼'
    },
    {
      id: '4',
      value: 'users',
      label: 'Users',
      description: 'All the users things',
      icon: '👥'
    },
    {
      id: '5',
      value: 'transactions',
      label: 'Transactions',
      description: 'All the transactions things',
      icon: '💸'
    },
    {
      id: '6',
      value: 'alerts',
      label: 'Alerts',
      description: 'All the alerts things',
      icon: '🚨'
    },
    {
      id: '7',
      value: 'compliance',
      label: 'Compliance',
      description: 'All the compliance things',
      icon: '🔒'
    }
    // Add more options as needed
  ];

  console.log('useMentions options:', options);
  return { options };
};