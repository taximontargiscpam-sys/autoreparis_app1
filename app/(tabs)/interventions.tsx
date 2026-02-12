import { useDeleteIntervention, useInterventions } from '@/lib/hooks/useInterventions';
import type { InterventionWithRelations } from '@/lib/database.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Calendar, Filter, Plus, Search, Trash2, Wrench } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InterventionsScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('Tous');

    const { data, isLoading, refetch } = useInterventions();
    const { mutate: deleteIntervention } = useDeleteIntervention();

    const interventions: InterventionWithRelations[] = useMemo(() => {
        const all = data?.data ?? [];
        if (!search.trim()) return all;
        const q = search.toLowerCase();
        return all.filter((i) => {
            const clientName = i.clients ? `${i.clients.nom} ${i.clients.prenom ?? ''}` : '';
            const vehicleName = i.vehicles ? `${i.vehicles.marque} ${i.vehicles.modele} ${i.vehicles.immatriculation ?? ''}` : '';
            return clientName.toLowerCase().includes(q) || vehicleName.toLowerCase().includes(q);
        });
    }, [data?.data, search]);

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
                            onError: (error) => Alert.alert("Erreur", error.message),
                        });
                    }
                }
            ]
        );
    };


    const renderRightActions = (_progress: any, _dragX: any, id: string) => {
        return (
            <TouchableOpacity
                onPress={() => handleDelete(id)}
                className="bg-red-500 justify-center items-center w-16 mb-4 rounded-r-2xl"
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'planifiee': return { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Planifiée' };
            case 'en_cours': return { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'En cours' };
            case 'terminee': return { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Terminée' };
            case 'facturee': return { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Facturée' };
            default: return { bg: 'bg-slate-500/10', text: 'text-slate-500', label: status };
        }
    };

    const renderItem = ({ item }: { item: InterventionWithRelations }) => {
        const statusStyle = getStatusStyle(item.statut);
        const clientName = item.clients ? `${item.clients.nom} ${item.clients.prenom || ''}` : 'Client Inconnu';
        const vehicleName = item.vehicles ? `${item.vehicles.marque} ${item.vehicles.modele}` : 'Véhicule Inconnu';

        return (
            <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id)}>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/interventions/[id]', params: { id: item.id } })}
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
                        <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
                            <Text className={`text-xs font-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
                        </View>
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
                    <TouchableOpacity accessibilityLabel="Filtrer les interventions" accessibilityRole="button" className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
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
            ) : (
                <ScrollView
                    className="flex-1 px-6"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                >
                    {/* EN COURS */}
                    {interventions.filter(i => i.statut === 'en_cours').length > 0 && (activeFilter === 'Tous' || activeFilter === 'en_cours') && (
                        <View className="mb-6">
                            <Text className="text-orange-500 font-bold mb-3 uppercase tracking-wider text-xs">En Cours ({interventions.filter(i => i.statut === 'en_cours').length})</Text>
                            {interventions.filter(i => i.statut === 'en_cours').map((item) => (
                                <View key={item.id}>{renderItem({ item })}</View>
                            ))}
                        </View>
                    )}

                    {/* PLANIFIÉES */}
                    {interventions.filter(i => i.statut === 'planifiee').length > 0 && (activeFilter === 'Tous' || activeFilter === 'planifiee') && (
                        <View className="mb-6">
                            <Text className="text-blue-500 font-bold mb-3 uppercase tracking-wider text-xs">Planifiées ({interventions.filter(i => i.statut === 'planifiee').length})</Text>
                            {interventions.filter(i => i.statut === 'planifiee').map((item) => (
                                <View key={item.id}>{renderItem({ item })}</View>
                            ))}
                        </View>
                    )}

                    {/* TERMINÉES */}
                    {interventions.filter(i => i.statut === 'terminee').length > 0 && (activeFilter === 'Tous' || activeFilter === 'terminee') && (
                        <View className="mb-6 opacity-60">
                            <Text className="text-green-500 font-bold mb-3 uppercase tracking-wider text-xs">Terminées ({interventions.filter(i => i.statut === 'terminee').length})</Text>
                            {interventions.filter(i => i.statut === 'terminee').map((item) => (
                                <View key={item.id}>{renderItem({ item })}</View>
                            ))}
                        </View>
                    )}

                    {interventions.length === 0 && (
                        <View className="items-center justify-center py-20">
                            <View className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                                <Wrench size={32} color="#cbd5e1" />
                            </View>
                            <Text className="text-slate-500 font-medium">Aucune intervention trouvée</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            <TouchableOpacity
                onPress={() => router.push('/interventions/new')}
                className="absolute bottom-6 right-6 bg-secondary w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-orange-500/40"
            >
                <Plus color="white" size={32} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
