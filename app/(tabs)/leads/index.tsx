import { useLeads, useDeleteLead } from '@/lib/hooks/useLeads';
import { supabaseWebsite } from '@/lib/supabaseWebsite';
import type { DevisAuto } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phone, Search, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Link, useRouter } from 'expo-router';

export default function LeadsScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const { data, isLoading, refetch } = useLeads(search);
    const leads = data ?? [];

    const deleteLead = useDeleteLead();

    // Realtime subscription — call refetch on any change
    useEffect(() => {
        const subscription = supabaseWebsite
            .channel('leads_realtime_devis')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'devis_auto' }, (_payload) => {
                refetch();
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [refetch]);

    const handleCall = (phone: string) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
    };

    const handleArchive = (id: string) => {
        deleteLead.mutate(id);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'nouveau': return { color: 'bg-blue-500', text: 'Nouveau', textColor: 'text-blue-100' };
            case 'contacte': return { color: 'bg-orange-500', text: 'Contacté', textColor: 'text-orange-100' };
            case 'converti': return { color: 'bg-green-500', text: 'Converti', textColor: 'text-green-100' };
            case 'perdu': return { color: 'bg-red-500', text: 'Perdu', textColor: 'text-red-100' };
            default: return { color: 'bg-slate-500', text: status || 'Nouveau', textColor: 'text-slate-100' };
        }
    };


    const renderRightActions = (_progress: any, _dragX: any, id: string) => {
        return (
            <TouchableOpacity
                onPress={() => handleArchive(id)}
                className="bg-red-500 justify-center items-center w-20 mb-4 rounded-r-2xl"
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: DevisAuto }) => {
        const statusInfo = getStatusInfo(item.statut);
        // Map fields that might be French or English
        const firstName = item.prenom || (item as any).prénom || 'Prospect';
        const lastName = item.nom || '';
        const msg = item.message || (item as any).description || 'Pas de message';
        const date = item.created_at || (item as any).cree_a || (item as any).date || new Date().toISOString();

        return (
            <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id)}>
                <View className="bg-white dark:bg-slate-900 rounded-[24px] mb-4 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <Link href={`/(tabs)/leads/${item.id}`} asChild>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            className="p-5"
                        >
                            {/* Header: Name + Status */}
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-xl font-black text-slate-900 dark:text-white capitalize" numberOfLines={1}>
                                        {firstName} {lastName}
                                    </Text>
                                    <Text className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">
                                        {formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })}
                                    </Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${statusInfo.color}`}>
                                    <Text className={`text-[10px] font-bold uppercase tracking-wide text-white`}>
                                        {statusInfo.text}
                                    </Text>
                                </View>
                            </View>

                            {/* Message Bubble */}
                            <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-5">
                                <Text className="text-slate-700 dark:text-slate-300 text-[15px] leading-6 font-medium">
                                    "{msg}"
                                </Text>
                                {item.vehicle_model && (
                                    <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex-row items-center">
                                        <Text className="text-slate-400 text-xs font-bold uppercase mr-2">Intérêt :</Text>
                                        <Text className="text-slate-900 dark:text-white text-xs font-bold">{item.vehicle_model}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Actions */}
                            <TouchableOpacity
                                onPress={() => handleCall(item.telephone || (item as any).tel)}
                                className="bg-emerald-500 h-14 rounded-full flex-row items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                                <Phone size={20} color="white" className="mr-3" />
                                <Text className="text-white font-bold text-lg tracking-wide">Contacter</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </Link>
                </View>
            </Swipeable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="p-6 pb-2">
                <Text className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Demandes</Text>
                <Text className="text-slate-500 mb-6 font-medium">Gérez vos demandes entrantes</Text>

                <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl px-5 h-14 mb-2 border border-slate-200 dark:border-slate-800 shadow-sm focus:border-blue-500 focus:border-2">
                    <Search size={22} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white text-lg font-medium"
                        placeholder="Rechercher un contact..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={leads}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 24, paddingTop: 10 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refetch().finally(() => setRefreshing(false)); }} />}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 opacity-50">
                        <Search size={48} color="#94a3b8" />
                        <Text className="text-slate-400 mt-4 text-lg font-medium">Aucune demande trouvée</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
