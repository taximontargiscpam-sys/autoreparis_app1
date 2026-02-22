import { useColorScheme } from '@/components/useColorScheme';
import { Tabs } from 'expo-router';
import { Calendar, Inbox, LayoutDashboard, Package, Users, Wrench } from 'lucide-react-native';
import React from 'react';

function TabBarIcon(props: {
  icon: React.ComponentType<{ size: number; color: string; style?: object }>;
  color: string;
}) {
  const Icon = props.icon;
  return <Icon size={24} color={props.color} style={{ marginBottom: -3 }} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FC6A03', // Orange for active
        tabBarInactiveTintColor: '#64748b', // Slate-500 for inactive
        headerShown: false, // Remove default top header
        tabBarStyle: {
          backgroundColor: '#0f172a', // slate-900 (matches app dark bg)
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarAccessibilityLabel: 'Tableau de bord',
          tabBarIcon: ({ color }) => <TabBarIcon icon={LayoutDashboard} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarAccessibilityLabel: 'Planning et Rendez-vous',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Calendar} color={color} />,
        }}
      />
      <Tabs.Screen
        name="interventions"
        options={{
          title: 'Atelier',
          tabBarAccessibilityLabel: 'Gestion de l\'atelier',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Wrench} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarAccessibilityLabel: 'Liste des clients',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Users} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stocks',
          tabBarAccessibilityLabel: 'Gestion des stocks',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Package} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Demandes',
          tabBarAccessibilityLabel: 'Demandes de devis et contacts',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Inbox} color={color} />,
        }}
      />
    </Tabs>
  );
}
