import { useColorScheme } from '@/components/useColorScheme';
import { Tabs } from 'expo-router';
import { Calendar, Inbox, LayoutDashboard, Package, Users, Wrench } from 'lucide-react-native';
import React from 'react';

function TabBarIcon(props: {
  icon: any;
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
          display: 'none', // Remove naming for cleaner look as requested? Or just keep small. User said "barre noir ou le nom des sections est affiché". Only removing labels might leave icons. Let's try removing labels or making them subtle.
          // User said "la barre noir en haut et en bas ou le nom des sections est affiché", implies they want to remove the 'bar' visual or headers.
          // Setting background to match app background fixes the "bar" look.
          fontSize: 10,
          fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon icon={LayoutDashboard} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Calendar} color={color} />,
        }}
      />
      <Tabs.Screen
        name="interventions"
        options={{
          title: 'Atelier',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Wrench} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Users} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stocks',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Package} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Demandes',
          tabBarIcon: ({ color }) => <TabBarIcon icon={Inbox} color={color} />,
        }}
      />
    </Tabs>
  );
}
