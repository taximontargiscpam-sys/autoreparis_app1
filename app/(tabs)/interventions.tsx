import ErrorState from '@/components/ErrorState';
import { StatusBadge } from '@/components/StatusBadge';
import type { InterventionWithRelations } from '@/lib/database.types';
import { useDeleteIntervention, useInfiniteInterventions } from '@/lib/hooks/useInterventions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Calendar, Filter, Plus, Search, Trash2, Wrench } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

type SectionRow =
    | { type: 'header'; title: string; count: number; color: string }
    | { type: 'item'; item: InterventionWithRelations };

export default function InterventionsScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('Tous');

    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteInterventions();
    const { mutate: deleteIntervention } = useDeleteIntervention();

    const allInterventions: InterventionWithRelations[] = useMemo(() => {
        return data?.pages.flatMap(p => p.data) ?? [];
    }, [data?.pages]);

    const interventions: InterventionWithRelations[] = useMemo(() => {
        if (!search.trim()) return allInterventions;
        const q = search.toLowerCase();
        return allInterventions.filter((i) => {
            const clientName = i.clients ? `${i.clients.nom} ${i.clients.prenom ?? ''}` : '';
            const vehicleName = i.vehicles ? `${i.vehicles.marque} ${i.vehicles.modele} ${i.vehicles.immatriculation ?? ''}` : '';
            return clientName.toLowerCase().includes(q) || vehicleName.toLowerCase().includes(q);
        });
    }, [allInterventions, search]);

    const sectionData: SectionRow[] = useMemo(() => {
        const sections: { title: string; value: string; color: string }[] = [
            { title: 'En Cours', value: 'en_cours', color: 'text-orange-500' },
            { title: 'Planifiées', value: 'planifiee', color: 'text-blue-500' },
            { title: 'Terminées', value: 'terminee', color: 'text-green-500' },
        ];
        const rows: SectionRow[] = [];
        for (const section of sections) {
            if (activeFilter !== 'Tous' && activeFilter !== section.value) continue;
            const items = interventions.filter(i => i.statut === section.value);
            if (items.length === 0) continue;
            rows.push({ type: 'header', title: section.title, count: items.length, color: section.color });
            for (const item of items) {
                rows.push({ type: 'item', item });
            }
        }
        return rows;
    }, [interventions, activeFilter]);

    const filters = [
        { label: 'Tous', value: 'Tous' },
        { label: 'Planifiées', value: 'planifiee' },
        { label: 'En cours', value: 'en_cours' },
        { label: 'Terminées', value: 'terminee' },
    ];

    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Supprimer",
            "Voulez-vous vraiment supprimer cette intervention ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => {
                        deleteIntervention(id, {
                            onError: () => Alert.alert("Erreur", "La suppression de l'intervention a échoué. Veuillez réessayer."),
                        });
                    }
                }
            ]
        );
    };


    const renderRightActions = (_progress: unknown, _dragX: unknown, id: string) => {
        return (
            <TouchableOpacity
                onPress={() => handleDelete(id)}
                accessibilityLabel="Supprimer l'intervention"
                accessibilityRole="button"
                className="bg-red-500 justify-center items-center w-16 mb-4 rounded-r-2xl"
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: InterventionWithRelations }) => {
        const clientName = item.clients ? `${item.clients.nom} ${item.clients.prenom || ''}` : 'Client Inconnu';
        const vehicleName = item.vehicles ? `${item.vehicles.marque} ${item.vehicles.modele}` : 'Véhicule Inconnu';

        return (
            <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id)}>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/interventions/[id]', params: { id: item.id } })}
                    accessibilityLabel={`Intervention ${vehicleName}, ${clientName}`}
                    accessibilityRole="button"
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl mb-4 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98]">
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full items-center justify-center mr-3">
                                <Wrench size={18} className="text-slate-600 dark:text-slate-300" color="#64748b" />
                            </View>
                            <View>
                                <Text className="font-bold text-lg text-slate-900 dark:text-white">{vehicleName}</Text>
                                <Text className="text-slate-500 text-sm">{clientName}</Text>
                            </View>
                        </View>
                        <StatusBadge status={item.statut} />
                    </View>

                    <View className="flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                        <View className="flex-row items-center">
                            <Calendar size={14} color="#94a3b8" />
                            <Text className="text-slate-500 text-xs ml-1.5">
                                {item.date_heure_debut_prevue ? format(new Date(item.date_heure_debut_prevue), 'dd MMM', { locale: fr }) : '--'}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="font-bold text-slate-900 dark:text-white mr-1">{item.total_vente || 0} €</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="p-6 pb-2">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-black text-slate-900 dark:text-white">Atelier</Text>
                    <TouchableOpacity
                        onPress={() => setActiveFilter(activeFilter === 'Tous' ? 'en_cours' : 'Tous')}
                        accessibilityLabel="Filtrer les interventions"
                        accessibilityRole="button"
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <Filter size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-xl px-4 h-12 mb-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                        placeholder="Rechercher une intervention..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filters */}
                <View className="flex-row mb-2">
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={filters}
                        keyExtractor={item => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setActiveFilter(item.value)}
                                accessibilityLabel={`Filtre ${item.label}`}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: activeFilter === item.value }}
                                className={`px-5 py-2.5 rounded-full mr-3 border ${activeFilter === item.value ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'bg-transparent border-slate-300 dark:border-slate-700'}`}
                            >
                                <Text className={`font-semibold ${activeFilter === item.value ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <FlatList
                    className="flex-1 px-6"
                    data={sectionData}
                    keyExtractor={(row, idx) => row.type === 'header' ? `header-${row.title}` : `item-${row.item.id}-${idx}`}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
                    onEndReachedThreshold={0.3}
                    renderItem={({ item: row }) => {
                        if (row.type === 'header') {
                            return (
                                <View className="mb-3 mt-2">
                                    <Text className={`${row.color} font-bold uppercase tracking-wider text-xs`}>
                                        {row.title} ({row.count})
                                    </Text>
                                </View>
                            );
                        }
                        return renderItem({ item: row.item });
                    }}
                    ListFooterComponent={isFetchingNextPage ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color="#0f172a" />
                        </View>
                    ) : null}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <View className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                                <Wrench size={32} color="#cbd5e1" />
                            </View>
                            <Text className="text-slate-600 font-medium">Aucune intervention trouvée</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                onPress={() => router.push('/interventions/new')}
                accessibilityLabel="Nouvelle intervention"
                accessibilityRole="button"
                className="absolute bottom-6 right-6 bg-secondary w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-orange-500/40"
            >
                <Plus color="white" size={32} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
