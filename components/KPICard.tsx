import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  delay: number;
  onPress?: () => void;
  trend?: string;
}

export function KPICard({ title, value, icon: Icon, color, delay, onPress, trend }: KPICardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="w-[48%] mb-3"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityLabel={`${title}: ${value}`}
        accessibilityRole="button"
        className="bg-white dark:bg-slate-900 p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800/50 h-32 justify-between"
      >
        <View className="flex-row justify-between items-start">
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
}
