import { supabase } from '@/lib/supabase';
import { addDays, format, isSameDay, startOfWeek, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CreditCard, Layers } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PerformanceScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        monthlyRevenue: 0,
        averageBasket: 0,
        interventionsCount: 0
    });
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        setLoading(true);
        const startDate = subDays(new Date(), 30).toISOString();

        const { data, error } = await supabase
            .from('interventions')
            .select('*, client:clients(nom, prenom), vehicle:vehicles(marque, modele, immatriculation)')
            // We include all 'money' statuses
            .in('statut', ['terminee', 'facturee'])
            .gte('created_at', startDate)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        if (data) {
            const revenue = data.reduce((acc, curr) => acc + (curr.total_vente || 0), 0);
            const count = data.length;
            const avg = count > 0 ? revenue / count : 0;

            setStats({
                monthlyRevenue: revenue,
                interventionsCount: count,
                averageBasket: Math.round(avg),
            });

            setTransactions(data);

            const today = new Date();
            const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday

            const chartData = Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(startOfCurrentWeek, i);
                const dayTotal = data
                    .filter(item => isSameDay(new Date(item.created_at), date))
                    .reduce((acc, curr) => acc + (curr.total_vente || 0), 0);
                return {
                    day: format(date, 'EEE', { locale: fr }).replace('.', ''),
                    value: dayTotal,
                    fullDate: date
                };
            });
            setWeeklyData(chartData);
        }
        setLoading(false);
    };

    const maxVal = Math.max(...(weeklyData.map(d => d.value) || [0]), 1);

    const filteredTransactions = selectedDay
        ? transactions.filter(t => isSameDay(new Date(t.created_at), selectedDay))
        : transactions;

    return (
        <View className="flex-1 bg-slate-950">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Background Gradient */}
            <LinearGradient
                colors={['#022c22', '#000000']}
                className="absolute top-0 left-0 right-0 h-64 opacity-50"
            />

            <SafeAreaView className="flex-1">
                {/* Custom Header */}
                <View className="px-6 py-2 flex-row items-center justify-between z-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-900/50 rounded-full items-center justify-center border border-white/10"
                    >
                        <ArrowLeft color="white" size={20} />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg tracking-wide">Tableau de Bord</Text>
                    <View className="w-10" />
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >

                    {loading ? (
                        <ActivityIndicator size="large" color="#10b981" className="mt-20" />
                    ) : (
                        <>
                            {/* Title Section */}
                            <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
                                <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">
                                    Vue d'ensemble
                                </Text>
                                <Text className="text-3xl font-black text-white">
                                    Performances
                                </Text>
                            </Animated.View>

                            {/* Weekly Chart */}
                            <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
                                <View className="bg-slate-900 border border-slate-800/60 p-6 rounded-[32px]">
                                    <View className="flex-row justify-between items-center mb-6">
                                        <Text className="text-white font-bold text-lg">Activité (7j)</Text>
                                        {selectedDay && (
                                            <TouchableOpacity
                                                onPress={() => setSelectedDay(null)}
                                                className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700"
                                            >
                                                <Text className="text-slate-300 text-xs font-bold">Réinitialiser</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View className="flex-row justify-between items-end h-40 space-x-2">
                                        {weeklyData.map((item, index) => {
                                            const isSelected = selectedDay && isSameDay(item.fullDate, selectedDay);
                                            const heightPercent = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                                            // Min height to show empty bars
                                            const displayHeight = Math.max(heightPercent, 5);

                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    activeOpacity={0.7}
                                                    onPress={() => setSelectedDay(isSelected ? null : item.fullDate)}
                                                    className="flex-1 items-center h-full justify-end"
                                                >
                                                    <View className="w-full relative py-1 justify-end h-full">
                                                        {/* Tooltip for value if selected */}
                                                        {isSelected && (
                                                            <Animated.View entering={FadeInDown.duration(200)} className="absolute -top-8 w-[150%] left-[-25%] items-center z-10">
                                                                <View className="bg-emerald-500 px-2 py-1 rounded-lg">
                                                                    <Text className="text-white text-[10px] font-bold">{item.value}€</Text>
                                                                </View>
                                                                <View className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-emerald-500" />
                                                            </Animated.View>
                                                        )}

                                                        <LinearGradient
                                                            colors={isSelected ? ['#34d399', '#10b981'] : ['#334155', '#1e293b']}
                                                            className={`w-full rounded-xl ${isSelected ? 'shadow-lg shadow-emerald-500/30' : ''}`}
                                                            style={{ height: `${displayHeight}%` }}
                                                        />
                                                    </View>
                                                    <Text className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                        {item.day}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Secondary Stats Row */}
                            <View className="flex-row flex-wrap justify-between mb-8">
                                <Animated.View entering={FadeInDown.delay(400).springify()} className="w-[48%]">
                                    <View className="bg-slate-900 p-5 rounded-[28px] border border-slate-800 justify-between h-36 relative overflow-hidden">
                                        <LinearGradient colors={['rgba(59,130,246,0.1)', 'transparent']} className="absolute inset-0" />
                                        <View className="bg-blue-500/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                                            <CreditCard color="#3b82f6" size={20} />
                                        </View>
                                        <View>
                                            <Text className="text-3xl font-black text-white">{stats.averageBasket} €</Text>
                                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">Panier Moyen</Text>
                                        </View>
                                    </View>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(500).springify()} className="w-[48%]">
                                    <View className="bg-slate-900 p-5 rounded-[28px] border border-slate-800 justify-between h-36 relative overflow-hidden">
                                        <LinearGradient colors={['rgba(236,72,153,0.1)', 'transparent']} className="absolute inset-0" />
                                        <View className="bg-pink-500/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                                            <Layers color="#ec4899" size={20} />
                                        </View>
                                        <View>
                                            <Text className="text-3xl font-black text-white">{stats.interventionsCount}</Text>
                                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">Interventions</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            </View>

                            {/* Detailed List Header */}
                            <Animated.View entering={FadeInDown.delay(600).springify()} className="mb-4 flex-row items-center justify-between">
                                <Text className="text-white font-bold text-lg">
                                    {selectedDay ? `Détail du ${format(selectedDay, 'd MMMM', { locale: fr })}` : 'Dernières rentrées'}
                                </Text>
                                <View className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                                    <Text className="text-slate-400 text-xs font-bold">{filteredTransactions.length} ops</Text>
                                </View>
                            </Animated.View>

                            {/* Transactions Stack */}
                            <View className="space-y-3">
                                {filteredTransactions.length === 0 ? (
                                    <View className="items-center py-10 opacity-50">
                                        <Text className="text-slate-500 font-bold">Aucune activité ce jour-là</Text>
                                    </View>
                                ) : (
                                    filteredTransactions.map((item, index) => (
                                        <Animated.View
                                            key={item.id}
                                            entering={FadeInDown.delay(600 + (index * 50)).springify()}
                                            className="bg-slate-900 p-4 rounded-2xl flex-row items-center border border-slate-800/50"
                                        >
                                            <View className="bg-slate-950 w-12 h-12 rounded-xl items-center justify-center mr-4 border border-slate-800">
                                                <Calendar size={20} color="#64748b" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-bold text-base" numberOfLines={1}>
                                                    {item.client?.prenom} {item.client?.nom}
                                                </Text>
                                                <Text className="text-slate-500 text-xs font-medium uppercase mt-0.5">
                                                    {item.vehicle?.marque} {item.vehicle?.modele}
                                                </Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-emerald-400 font-black text-lg">+{item.total_vente || 0} €</Text>
                                                <Text className="text-slate-600 text-[10px] font-bold">
                                                    {format(new Date(item.created_at), 'HH:mm')}
                                                </Text>
                                            </View>
                                        </Animated.View>
                                    ))
                                )}
                            </View>

                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
