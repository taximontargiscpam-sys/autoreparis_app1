import { useDashboardStats } from '@/lib/hooks/useInterventions';
import { useRouter } from 'expo-router';
import { AlertTriangle, Plus, ScanBarcode, TrendingUp, Users, Wrench } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { data, refetch } = useDashboardStats();

  const stats = data ?? {
    interventionsCount: 0,
    leadsCount: 0,
    stockLowCount: 0,
    revenue: 0,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const KPICard = ({ title, value, icon: Icon, color, delay, onPress, trend }: any) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(delay).springify()}
        className="w-[48%] mb-3"
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          className="bg-white dark:bg-slate-900 p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800/50 h-32 justify-between"
        >
          <View className="flex-row justify-between items-start">
            {/* Solid background color for Icon with White Icon */}
            <View className={`w-10 h-10 rounded-2xl items-center justify-center ${color} shadow-lg shadow-orange-500/20`}>
              <Icon size={20} className="text-white" />
            </View>
            {trend && (
              <View className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black">{trend}</Text>
              </View>
            )}
          </View>
          <View>
            <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</Text>
            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mt-1">{title}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Modern Header */}
          <View className="flex-row justify-between items-center mb-6 mt-1">
            <View>
              <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Auto Reparis</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} accessibilityLabel="Profil" accessibilityRole="button" className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 items-center justify-center shadow-sm active:scale-95">
              <Users size={18} className="text-slate-900 dark:text-white" />
            </TouchableOpacity>
          </View>

          {/* KPI Grid */}
          <View className="flex-row flex-wrap justify-between mb-2">
            <KPICard
              title="Interventions"
              value={stats.interventionsCount}
              icon={Wrench}
              color="bg-secondary"
              delay={100}
              onPress={() => router.push('/(tabs)/interventions')}
            />
            <KPICard
              title="CA Hebdo"
              value={`${stats.revenue} €`}
              icon={TrendingUp}
              color="bg-secondary"
              delay={200}
              onPress={() => router.push('/performance')}
            />
            <KPICard
              title="Demandes"
              value={stats.leadsCount}
              icon={Users}
              color="bg-secondary"
              delay={300}
              onPress={() => router.push('/(tabs)/leads')}
            />
            <KPICard
              title="Stock Faible"
              value={stats.stockLowCount}
              icon={AlertTriangle}
              color="bg-secondary"
              delay={400}
              onPress={() => router.push('/(tabs)/stock')}
            />
          </View>

          {/* Quick Navigation */}
          <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-4">
            <TouchableOpacity onPress={() => router.push('/(tabs)/planning')} activeOpacity={0.9}>
              <View className="bg-white dark:bg-slate-900 rounded-[30px] p-5 shadow-sm border border-slate-100 dark:border-slate-800/50 flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">Planning</Text>
                  <Text className="text-slate-400 text-xs mt-1">Voir les rendez-vous de la semaine</Text>
                </View>
                <Text className="text-primary font-bold text-sm">Ouvrir ›</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Actions - Modern Buttons */}
          <Animated.View entering={FadeInDown.delay(600).springify()} className="mb-4">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4 ml-1">Actions Rapides</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => router.push('/interventions/new')}
                accessibilityLabel="Nouvelle intervention"
                accessibilityRole="button"
                className="flex-1 bg-slate-900 dark:bg-white h-[72px] rounded-[24px] flex-row items-center justify-center shadow-lg shadow-slate-900/20 active:scale-[0.98]"
              >
                <View className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/10 items-center justify-center mr-3">
                  <Plus size={18} className="text-white dark:text-black" strokeWidth={3} />
                </View>
                <Text className="text-white dark:text-slate-900 font-bold text-lg">Nouvelle Interv.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/scan')}
                accessibilityLabel="Scanner un code-barres"
                accessibilityRole="button"
                className="w-[72px] h-[72px] bg-blue-600 rounded-[24px] items-center justify-center shadow-lg shadow-blue-500/30 active:scale-[0.98]"
              >
                <ScanBarcode size={24} className="text-white" />
              </TouchableOpacity>
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
