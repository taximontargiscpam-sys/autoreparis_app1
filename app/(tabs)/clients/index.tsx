import ErrorState from '@/components/ErrorState';
import type { Client } from '@/lib/database.types';
import { useDeleteClient, useInfiniteClients } from '@/lib/hooks/useClients';
import { useRouter } from 'expo-router';
import { Plus, Search, Trash2, User } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientsScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteClients(search);
    const deleteClient = useDeleteClient();

    const clients = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data?.pages]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleDelete = (id: string, nom: string) => {
        Alert.alert(
            "Supprimer",
            `Voulez-vous vraiment supprimer ${nom} ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => {
                        deleteClient.mutate(id, {
                            onError: () => Alert.alert("Erreur", "La suppression a échoué. Ce client a peut-être des interventions en cours."),
                        });
                    }
                }
            ]
        );
    };


    const renderRightActions = (_progress: unknown, _dragX: unknown, id: string, nom: string) => {
        return (
            <TouchableOpacity
                onPress={() => handleDelete(id, nom)}
                accessibilityLabel={`Supprimer ${nom}`}
                accessibilityRole="button"
                className="bg-red-500 justify-center items-center w-16 mb-3 rounded-r-2xl"
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Client }) => (
        <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id, item.nom)}>
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/(tabs)/clients/[id]', params: { id: item.id } })}
                accessibilityLabel={`Client ${item.nom} ${item.prenom}`}
                accessibilityRole="button"
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 shadow-sm border border-slate-100 dark:border-slate-700 flex-row items-center"
            >
                <View className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full mr-4">
                    <User size={24} color="#64748b" />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{item.nom} {item.prenom}</Text>
                    <Text className="text-slate-500 text-sm">{item.telephone || 'Sans téléphone'} • {item.ville || 'Ville inconnue'}</Text>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );


    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="p-6 pb-2">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-black text-slate-900 dark:text-white">Clients</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/clients/new_client')}
                        accessibilityLabel="Ajouter un client"
                        accessibilityRole="button"
                        className="bg-blue-600 p-3 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 flex-row items-center border border-slate-200 dark:border-slate-700 mb-2">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                        placeholder="Rechercher un client..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={(t) => setSearch(t)}
                    />
                </View>
            </View>

            {isLoading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <FlatList
                    data={clients}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24, paddingTop: 0 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={isFetchingNextPage ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color="#2563eb" />
                        </View>
                    ) : null}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Text className="text-slate-500 text-center">Aucun client trouvé.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
