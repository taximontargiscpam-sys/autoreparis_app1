import InterventionParts from '@/components/intervention/InterventionParts';
import InterventionPhotos from '@/components/intervention/InterventionPhotos';
import InterventionSummary from '@/components/intervention/InterventionSummary';
import type { InterventionWithRelations } from '@/lib/database.types';
import { useAssignMechanic, useIntervention } from '@/lib/hooks/useInterventions';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, FileText, User, Wrench, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function InterventionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<'summary' | 'parts' | 'photos'>('summary');
    const [showMechanicModal, setShowMechanicModal] = useState(false);

    // React Query: fetch intervention detail
    const { data: intervention, isLoading, refetch } = useIntervention(id);

    // React Query: fetch active users for mechanic assignment
    const { data: users = [] } = useQuery({
        queryKey: ['users-active'],
        queryFn: async () => {
            const { data, error } = await supabase.from('users').select('*').eq('actif', true).order('nom');
            if (error) throw error;
            return data ?? [];
        },
    });

    // React Query: assign mechanic mutation
    const assignMechanic = useAssignMechanic();

    useEffect(() => {
        if (!id) {
            router.back();
        }
    }, [id]);

    const updateMechanic = async (userId: string) => {
        try {
            await assignMechanic.mutateAsync({ interventionId: id!, mecanicienId: userId });
            setShowMechanicModal(false);
            // Also refetch the single intervention to update the detail view
            qc.invalidateQueries({ queryKey: ['intervention', id] });
        } catch {
            alert('Erreur lors de l\'affectation');
        }
    };

    const renderHeader = () => (
        <View className="px-6 pt-2 pb-6 bg-slate-900 border-b border-slate-800">
            <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center">
                <ArrowLeft color="#94a3b8" size={20} />
                <Text className="text-slate-400 ml-2 font-medium">Retour à la liste</Text>
            </TouchableOpacity>

            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <Text className="text-2xl font-bold text-white mb-1">
                        {intervention?.vehicles?.marque} {intervention?.vehicles?.modele}
                    </Text>
                    <Text className="text-slate-400 font-medium text-lg uppercase tracking-wider">
                        {intervention?.vehicles?.immatriculation}
                    </Text>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${getStatusColor(intervention?.statut)}`}>
                    <Text className="text-xs font-bold text-white capitalize">
                        {intervention?.statut?.replace('_', ' ')}
                    </Text>
                </View>
            </View>

            {/* Mechanic Assignment Button */}
            <TouchableOpacity
                onPress={() => setShowMechanicModal(true)}
                className="flex-row items-center bg-slate-800 p-3 rounded-xl border border-slate-700 mb-4"
            >
                <View className="bg-blue-600/20 p-2 rounded-full mr-3">
                    <User size={16} color="#3b82f6" />
                </View>
                <View>
                    <Text className="text-xs text-slate-500 uppercase font-bold">Mécanicien</Text>
                    <Text className="text-white font-bold text-base">
                        {intervention?.mecanicien ? `${intervention.mecanicien.prenom} ${intervention.mecanicien.nom}` : 'Non assigné'}
                    </Text>
                </View>
                <Text className="ml-auto text-blue-500 text-xs font-bold">Modifier</Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
                <Text className="text-slate-500 mr-2">Client:</Text>
                <Text className="text-slate-300 font-medium">{intervention?.clients?.nom} {intervention?.clients?.prenom}</Text>
            </View>
        </View>
    );

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case 'planifiee': return 'bg-blue-600';
            case 'en_cours': return 'bg-orange-600';
            case 'terminee': return 'bg-green-600';
            default: return 'bg-slate-600';
        }
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <TouchableOpacity
            onPress={() => setActiveTab(id)}
            className={`flex-1 items-center justify-center py-4 border-b-2 ${activeTab === id ? 'border-blue-500' : 'border-transparent'}`}
        >
            <Icon size={20} color={activeTab === id ? '#3b82f6' : '#94a3b8'} className="mb-1" />
            <Text className={`text-xs font-bold ${activeTab === id ? 'text-blue-500' : 'text-slate-500'}`}>{label}</Text>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {renderHeader()}

            {/* Tabs */}
            <View className="flex-row bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <TabButton id="summary" label="Résumé" icon={FileText} />
                <TabButton id="parts" label="Pièces" icon={Wrench} />
                <TabButton id="photos" label="Photos" icon={Camera} />
            </View>

            {/* Content */}
            <View className="flex-1">
                {activeTab === 'summary' && <InterventionSummary intervention={intervention} refresh={refetch} />}
                {activeTab === 'parts' && <InterventionParts intervention={intervention} />}
                {activeTab === 'photos' && <InterventionPhotos intervention={intervention} />}
            </View>

            {/* Mechanic Selection Modal */}
            <Modal
                visible={showMechanicModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMechanicModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-slate-900 rounded-t-[30px] p-6 h-[50%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white">Assigner un mécanicien</Text>
                            <TouchableOpacity onPress={() => setShowMechanicModal(false)} className="bg-slate-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {users.map((user: any) => (
                                <TouchableOpacity
                                    key={user.id}
                                    onPress={() => updateMechanic(user.id)}
                                    className={`flex-row items-center p-4 mb-3 rounded-xl border ${intervention?.mecanicien?.id === user.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-4">
                                        <Text className="text-white font-bold">{user.prenom[0]}{user.nom[0]}</Text>
                                    </View>
                                    <View>
                                        <Text className={`font-bold text-lg ${intervention?.mecanicien?.id === user.id ? 'text-blue-400' : 'text-white'}`}>
                                            {user.prenom} {user.nom}
                                        </Text>
                                        <Text className="text-slate-400 text-xs uppercase">{user.statut || 'Mécanicien'}</Text>
                                    </View>
                                    {intervention?.mecanicien?.id === user.id && (
                                        <View className="ml-auto bg-blue-500 px-3 py-1 rounded-full">
                                            <Text className="text-white text-xs font-bold">Assigné</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
