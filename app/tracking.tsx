import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CheckCircle, Clock, Hammer, Image as ImageIcon, Info, User, Wrench } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import type { InterventionLine, InterventionStatus, VehiclePhoto } from '../lib/database.types';

interface TrackingIntervention {
    id: string;
    statut: InterventionStatus;
    type_intervention: string | null;
    commentaire: string | null;
    date_heure_fin_prevue: string | null;
    total_ttc: number | null;
    created_at: string;
    vehicles: { immatriculation: string; marque: string; modele: string } | null;
    mecanicien: { nom: string | null; prenom: string | null } | null;
    lines: InterventionLine[];
    photos: VehiclePhoto[];
}

interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    date: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    color: string;
    isHighlight?: boolean;
}

async function fetchInterventionData(targetId: string) {
    // Always use the public RPC to expose only the data intended for tracking
    const { data, error } = await supabase
        .rpc('get_intervention_details_public', { intervention_id: targetId });

    if (error) throw error;
    return data;
}

function generateTimeline(data: TrackingIntervention): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // 1. Creation Event
    events.push({
        id: 'created',
        type: 'status',
        title: 'Prise en charge du véhicule',
        date: data.created_at,
        icon: Calendar,
        color: 'bg-blue-500'
    });

    // 2. Add specific lines (Parts/Labor) as events
    if (data.lines) {
        data.lines.forEach((line) => {
            events.push({
                id: line.id,
                type: line.type_ligne || 'piece',
                title: line.description || (line.type_ligne === 'piece' ? 'Pièce ajoutée' : 'Main d\'oeuvre'),
                subtitle: line.quantite > 1 ? `${line.quantite}x - Ajouté à la réparation` : 'Ajouté à la réparation',
                date: data.created_at,
                icon: line.type_ligne === 'piece' ? Wrench : Hammer,
                color: line.type_ligne === 'piece' ? 'bg-orange-500' : 'bg-purple-500'
            });
        });
    }

    // 3. Current Status Event (if not just created)
    if (data.statut === 'terminee') {
        events.push({
            id: 'finished',
            type: 'status',
            title: 'Reparations terminees',
            date: new Date().toISOString(),
            icon: CheckCircle,
            color: 'bg-green-500',
            isHighlight: true
        });
    }

    // Sort by date descending (newest first)
    return events.reverse();
}

export default function TrackingScreen() {
    const { id: rawId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const qc = useQueryClient();

    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const { width } = useWindowDimensions();

    // React Query for initial data fetch and cache management
    const { data: intervention, isLoading } = useQuery<TrackingIntervention>({
        queryKey: ['tracking', id],
        queryFn: () => fetchInterventionData(id!),
        enabled: !!id,
    });

    // Derive timeline from intervention data
    const timelineEvents = useMemo(() => {
        if (!intervention) return [];
        return generateTimeline(intervention);
    }, [intervention]);

    // Realtime subscription: invalidate the React Query cache on changes
    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`intervention-${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interventions', filter: `id=eq.${id}` }, () => {
                qc.invalidateQueries({ queryKey: ['tracking', id] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'intervention_lines', filter: `intervention_id=eq.${id}` }, () => {
                qc.invalidateQueries({ queryKey: ['tracking', id] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_photos', filter: `intervention_id=eq.${id}` }, () => {
                qc.invalidateQueries({ queryKey: ['tracking', id] });
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [id, qc]);

    // Navigation helper
    const goBack = () => {
        router.back();
    };

    if (isLoading) return <View className="flex-1 bg-slate-900 justify-center items-center"><ActivityIndicator color="#22c55e" /></View>;
    if (!intervention) return (
        <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center p-4">
            <Text className="text-white text-lg font-bold mb-2">Intervention introuvable</Text>
            <Text className="text-slate-500 text-center">Impossible de charger les details de cette intervention.</Text>
            <TouchableOpacity onPress={goBack} className="mt-8 bg-slate-800 px-6 py-3 rounded-full">
                <Text className="text-white font-bold">Retour</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    const parts = intervention.lines?.filter((line) => line.type_ligne === 'piece') || [];
    const labor = intervention.lines?.filter((line) => line.type_ligne === 'main_oeuvre') || [];
    const photos = intervention.photos || [];

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            {/* Header */}
            <View className="p-4 flex-row items-center justify-between z-10">
                <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center border border-slate-700">
                    <ArrowLeft color="white" size={20} />
                </TouchableOpacity>
                <View className={`px-3 py-1 rounded-full ${intervention.statut === 'en_cours' ? 'bg-orange-500/20' : 'bg-slate-800'}`}>
                    <Text className={`font-bold uppercase text-xs ${intervention.statut === 'en_cours' ? 'text-orange-500' : 'text-slate-400'}`}>
                        {intervention.statut?.replace('_', ' ')}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-6 pt-2 pb-6">
                    {/* Vehicle Title */}
                    <View className="mb-6">
                        <Text className="text-4xl font-black text-white mb-1">{intervention.vehicles?.immatriculation}</Text>
                        <Text className="text-slate-400 text-lg">{intervention.vehicles?.marque} {intervention.vehicles?.modele}</Text>
                    </View>

                    {/* Progress Bar (Visual) */}
                    <View className="h-1.5 bg-slate-800 rounded-full mb-8 overflow-hidden">
                        <View
                            className={`h-full rounded-full ${intervention.statut === 'terminee' ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: intervention.statut === 'terminee' ? '100%' : intervention.statut === 'en_cours' ? '60%' : '15%' }}
                        />
                    </View>

                    {/* TIMELINE VIEW (Single View Mode) */}
                    <View>
                        {/* Estimated Completion Card */}
                        {intervention.statut !== 'terminee' && (
                            <View className="bg-slate-800 p-5 rounded-2xl mb-8 border border-slate-700 shadow-lg relative overflow-hidden">
                                <View className="absolute top-0 right-0 p-4 opacity-10">
                                    <Clock size={100} color="white" />
                                </View>
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Estimation de fin</Text>
                                <Text className="text-3xl font-bold text-white mb-2">
                                    {intervention.date_heure_fin_prevue
                                        ? format(new Date(intervention.date_heure_fin_prevue), "dd MMM 'à' HH:mm", { locale: fr })
                                        : 'A confirmer'}
                                </Text>
                                {intervention.mecanicien && (
                                    <View className="flex-row items-center mt-2 bg-slate-900/50 self-start px-3 py-1.5 rounded-full">
                                        <User size={12} color="#94a3b8" className="mr-2" />
                                        <Text className="text-slate-300 text-xs">
                                            Mecanicien : {intervention.mecanicien.prenom} {intervention.mecanicien.nom}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {intervention.commentaire && (
                            <View className="bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-700">
                                <View className="flex-row items-center mb-2">
                                    <Info size={14} color="#94a3b8" className="mr-2" />
                                    <Text className="text-slate-400 text-xs font-bold uppercase">Note du mecanicien</Text>
                                </View>
                                <Text className="text-slate-200 italic">" {intervention.commentaire} "</Text>
                            </View>
                        )}

                        <Text className="text-slate-500 font-bold mb-6 uppercase text-xs tracking-wider">Dernieres Activites</Text>
                        {timelineEvents.map((event, index) => {
                            const Icon = event.icon;
                            const isLast = index === timelineEvents.length - 1;

                            return (
                                <View key={index} className="flex-row">
                                    <View className="items-center mr-4">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center shadow-lg ${event.color} z-10`}>
                                            <Icon size={18} color="white" />
                                        </View>
                                        {!isLast && <View className="w-0.5 flex-1 bg-slate-800 my-1" />}
                                    </View>
                                    <View className="flex-1 pb-8">
                                        <View className={`bg-slate-800/50 p-4 rounded-2xl border ${event.isHighlight ? 'border-green-500/30 bg-green-500/10' : 'border-slate-800'}`}>
                                            <View className="flex-row justify-between items-start mb-1">
                                                <Text className={`font-bold text-base flex-1 mr-2 ${event.isHighlight ? 'text-green-400' : 'text-white'}`}>
                                                    {event.title}
                                                </Text>
                                                <Text className="text-slate-500 text-xs">
                                                    {event.date ? format(new Date(event.date), 'HH:mm') : ''}
                                                </Text>
                                            </View>
                                            {event.subtitle && (
                                                <Text className="text-slate-400 text-sm">{event.subtitle}</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* SECTION: DETAILS & BILLING */}
                    <View className="mt-8 pt-8 border-t border-slate-800">
                        <Text className="text-slate-500 font-bold mb-6 uppercase text-xs tracking-wider">Details & Facturation</Text>

                        {/* Financial Summary */}
                        <View className="bg-slate-800 p-6 rounded-3xl mb-6 border border-slate-700 shadow-sm">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Total Estime</Text>
                            <View className="flex-row items-end">
                                <Text className="text-4xl font-black text-white">{intervention.total_ttc || '0.00'} </Text>
                                <Text className="text-slate-500 text-lg mb-1.5 ml-2">TTC</Text>
                            </View>
                        </View>

                        {/* Parts List */}
                        <Text className="text-slate-400 font-bold mb-4 uppercase text-[10px] tracking-wider ml-1">Pieces ({parts.length})</Text>
                        {parts.length > 0 ? parts.map((line) => (
                            <View key={line.id} className="bg-slate-800/50 p-4 rounded-2xl mb-3 border border-slate-800 flex-row justify-between items-center">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-10 h-10 bg-orange-500/10 rounded-xl items-center justify-center mr-3">
                                        <Wrench size={18} className="text-orange-500" />
                                    </View>
                                    <View className="flex-1 mr-2">
                                        <Text className="text-white font-bold text-base">{line.description}</Text>
                                        <Text className="text-slate-500 text-xs text-slate-400">Quantite: {line.quantite}</Text>
                                    </View>
                                </View>
                                <Text className="text-white font-bold">{line.total_vente_ligne} €</Text>
                            </View>
                        )) : (
                            <Text className="text-slate-600 italic mb-6 ml-1">Aucune piece listee</Text>
                        )}

                        {/* Labor List */}
                        <Text className="text-slate-400 font-bold mt-4 mb-4 uppercase text-[10px] tracking-wider ml-1">Main d'oeuvre</Text>
                        {labor.length > 0 ? labor.map((line) => (
                            <View key={line.id} className="bg-slate-800/50 p-4 rounded-2xl mb-3 border border-slate-800 flex-row justify-between items-center">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-10 h-10 bg-purple-500/10 rounded-xl items-center justify-center mr-3">
                                        <Hammer size={18} className="text-purple-500" />
                                    </View>
                                    <View className="flex-1 mr-2">
                                        <Text className="text-white font-bold text-base">{line.description}</Text>
                                        <Text className="text-slate-500 text-xs text-slate-400">Temps passe</Text>
                                    </View>
                                </View>
                                <Text className="text-white font-bold">{line.total_vente_ligne} €</Text>
                            </View>
                        )) : (
                            <Text className="text-slate-600 italic ml-1">Aucune main d'oeuvre listee</Text>
                        )}
                    </View>

                    {/* SECTION: PHOTOS */}
                    <View className="mt-8 pt-8 border-t border-slate-800">
                        <View className="flex-row items-center mb-6">
                            <Text className="text-slate-500 font-bold uppercase text-xs tracking-wider flex-1">Galerie Photos</Text>
                            <View className="bg-slate-800 px-3 py-1 rounded-full">
                                <Text className="text-slate-400 text-xs font-bold">{photos.length} photos</Text>
                            </View>
                        </View>

                        {photos.length === 0 ? (
                            <View className="items-center justify-center py-12 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                                <ImageIcon size={32} color="#475569" />
                                <Text className="text-slate-500 mt-3 font-medium text-sm">Aucune photo disponible</Text>
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
                                {photos.map((photo) => (
                                    <TouchableOpacity
                                        key={photo.id}
                                        onPress={() => setSelectedPhoto(photo.url_image)}
                                        className="w-40 h-56 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 relative"
                                    >
                                        <Image
                                            source={{ uri: photo.url_image }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                        <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                                            <Text className="text-white text-[10px] text-center">{photo.created_at ? format(new Date(photo.created_at), 'dd/MM HH:mm') : ''}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Photo Modal */}
            <Modal visible={!!selectedPhoto} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
                <View className="flex-1 bg-black justify-center items-center">
                    <TouchableOpacity
                        onPress={() => setSelectedPhoto(null)}
                        className="absolute top-12 right-6 z-20 bg-slate-800/80 p-2 rounded-full"
                    >
                        <Text className="text-white font-bold">Fermer</Text>
                    </TouchableOpacity>
                    {selectedPhoto && (
                        <Image
                            source={{ uri: selectedPhoto }}
                            style={{ width: width, height: '80%' }}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
