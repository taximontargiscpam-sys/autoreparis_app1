import { supabase } from '@/lib/supabase';
import type { InterventionWithRelations, InterventionLine } from '@/lib/database.types';
import { interventionLineSchema, getValidationError } from '@/lib/validations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PenTool, Plus, Trash2, Wrench } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface InterventionPartsProps {
    intervention: InterventionWithRelations;
}

export default function InterventionParts({ intervention }: InterventionPartsProps) {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isDummy = intervention.id.toString().startsWith('dummy');
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [newLine, setNewLine] = useState({
        type_ligne: 'piece' as 'piece' | 'main_oeuvre',
        description: '',
        quantite: '1',
        prix_vente_unitaire: '',
    });

    // --- React Query: fetch lines ---
    const { data: lines = [], isLoading, refetch } = useQuery<InterventionLine[]>({
        queryKey: ['intervention-lines', intervention.id],
        enabled: !isDummy,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('intervention_lines')
                .select('*')
                .eq('intervention_id', intervention.id);
            if (error) throw error;
            return data as InterventionLine[];
        },
    });

    // --- Realtime subscription (triggers refetch) ---
    useEffect(() => {
        if (isDummy) return;

        channelRef.current = supabase
            .channel(`lines-${intervention.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'intervention_lines',
                    filter: `intervention_id=eq.${intervention.id}`,
                },
                () => { refetch(); }
            )
            .subscribe();

        return () => {
            channelRef.current?.unsubscribe();
            channelRef.current = null;
        };
    }, [intervention.id, isDummy, refetch]);

    // --- Mutation: add line ---
    const addLineMutation = useMutation({
        mutationFn: async (lineData: {
            type_ligne: string;
            description: string;
            quantite: number;
            prix_vente_unitaire: number;
            prix_achat_unitaire: number;
        }) => {
            const { error } = await supabase.from('intervention_lines').insert([{
                intervention_id: intervention.id,
                ...lineData,
            }]);
            if (error) throw error;
        },
        onSuccess: async () => {
            // Recalculate totals server-side
            await supabase.rpc('recalculate_intervention_totals', {
                p_intervention_id: intervention.id,
            });
            queryClient.invalidateQueries({ queryKey: ['intervention-lines', intervention.id] });
            queryClient.invalidateQueries({ queryKey: ['intervention', intervention.id] });
            queryClient.invalidateQueries({ queryKey: ['interventions'] });
        },
        onError: () => {
            Alert.alert('Erreur', 'Impossible d\'ajouter la ligne');
        },
    });

    // --- Mutation: delete line ---
    const deleteLineMutation = useMutation({
        mutationFn: async (lineId: string) => {
            const { error } = await supabase.from('intervention_lines').delete().eq('id', lineId);
            if (error) throw error;
        },
        onSuccess: async () => {
            // Recalculate totals server-side
            await supabase.rpc('recalculate_intervention_totals', {
                p_intervention_id: intervention.id,
            });
            queryClient.invalidateQueries({ queryKey: ['intervention-lines', intervention.id] });
            queryClient.invalidateQueries({ queryKey: ['intervention', intervention.id] });
            queryClient.invalidateQueries({ queryKey: ['interventions'] });
        },
    });

    const resetForm = () => {
        setNewLine({ type_ligne: 'piece', description: '', quantite: '1', prix_vente_unitaire: '' });
    };

    const handleAddLine = async () => {
        // Parse numeric values for validation
        const parsedQuantite = parseFloat(newLine.quantite.replace(',', '.'));
        const parsedPrix = parseFloat(newLine.prix_vente_unitaire.replace(',', '.'));

        // Zod validation
        const result = interventionLineSchema.safeParse({
            type_ligne: newLine.type_ligne,
            description: newLine.description,
            quantite: isNaN(parsedQuantite) ? 0 : parsedQuantite,
            prix_vente_unitaire: isNaN(parsedPrix) ? -1 : parsedPrix,
            prix_achat_unitaire: 0,
        });

        const validationError = getValidationError(result);
        if (validationError) {
            Alert.alert('Erreur de validation', validationError);
            return;
        }

        const validated = result.data!;

        // Dummy Data Handling
        if (isDummy) {
            const dummyLine: InterventionLine = {
                id: Math.random().toString(),
                intervention_id: intervention.id,
                type_ligne: validated.type_ligne,
                description: validated.description,
                quantite: validated.quantite,
                prix_vente_unitaire: validated.prix_vente_unitaire,
                prix_achat_unitaire: validated.prix_achat_unitaire ?? 0,
                product_id: null,
                total_achat_ligne: 0,
                total_vente_ligne: validated.quantite * validated.prix_vente_unitaire,
            };
            queryClient.setQueryData<InterventionLine[]>(
                ['intervention-lines', intervention.id],
                (old = []) => [...old, dummyLine]
            );
            setModalVisible(false);
            resetForm();
            return;
        }

        addLineMutation.mutate(
            {
                type_ligne: validated.type_ligne,
                description: validated.description,
                quantite: validated.quantite,
                prix_vente_unitaire: validated.prix_vente_unitaire,
                prix_achat_unitaire: validated.prix_achat_unitaire ?? 0,
            },
            {
                onSuccess: () => {
                    setModalVisible(false);
                    resetForm();
                },
            }
        );
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Confirmer', 'Supprimer cette ligne ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: () => {
                    // Dummy Data Handling
                    if (isDummy) {
                        queryClient.setQueryData<InterventionLine[]>(
                            ['intervention-lines', intervention.id],
                            (old = []) => old.filter(l => l.id !== id)
                        );
                        return;
                    }

                    deleteLineMutation.mutate(id);
                },
            },
        ]);
    };

    const renderLineItem = (item: InterventionLine) => (
        <View key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-3 flex-row items-center justify-between border border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center flex-1">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.type_ligne === 'piece' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                    {item.type_ligne === 'piece' ? <Wrench size={18} className="text-orange-600 dark:text-orange-400" /> : <PenTool size={18} className="text-purple-600 dark:text-purple-400" />}
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-slate-900 dark:text-white text-base">{item.description}</Text>
                    <Text className="text-slate-500 text-xs">Qté: {item.quantite} x {item.prix_vente_unitaire}€</Text>
                </View>
            </View>
            <View className="flex-row items-center">
                <Text className="font-bold text-slate-900 dark:text-white mr-4 text-lg">{item.quantite * item.prix_vente_unitaire} €</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1">
            <ScrollView className="flex-1 p-6">
                <View className="flex-row justify-between items-end mb-6">
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">Détail chiffré</Text>
                    <Text className="text-slate-500 text-sm">{lines.length} lignes</Text>
                </View>

                {isLoading ? <ActivityIndicator /> : lines.map(renderLineItem)}

                {lines.length === 0 && !isLoading && (
                    <View className="items-center py-10 opacity-50">
                        <Text className="text-slate-500">Aucune pièce ou main d'oeuvre ajoutée.</Text>
                    </View>
                )}

                <View className="h-24" />
            </ScrollView>

            {/* Floating Action Button */}
            <View className="absolute bottom-6 right-6 left-6">
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-900/20"
                >
                    <Plus color="white" size={24} className="mr-2" />
                    <Text className="text-white font-bold text-lg">Ajouter une ligne</Text>
                </TouchableOpacity>
            </View>



            {/* Add Line Overlay (Replaces Modal) */}
            {modalVisible && (
                <View className="absolute inset-0 z-50 justify-end">
                    {/* Backdrop */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                        className="absolute inset-0 bg-black/50"
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 h-[70%] w-full"
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Nouvelle Ligne</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-blue-500 font-bold text-lg">Annuler</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="flex-row mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <TouchableOpacity
                                    onPress={() => setNewLine({ ...newLine, type_ligne: 'piece' })}
                                    className={`flex-1 py-3 rounded-lg items-center ${newLine.type_ligne === 'piece' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                                >
                                    <Text className={`font-bold ${newLine.type_ligne === 'piece' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>Pièce 🔩</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setNewLine({ ...newLine, type_ligne: 'main_oeuvre' })}
                                    className={`flex-1 py-3 rounded-lg items-center ${newLine.type_ligne === 'main_oeuvre' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                                >
                                    <Text className={`font-bold ${newLine.type_ligne === 'main_oeuvre' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>Main d'oeuvre 🔧</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4">
                                <Text className="text-slate-500 mb-2 font-medium">Description</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                    placeholder={newLine.type_ligne === 'piece' ? "Ex: Filtre à huile" : "Ex: Remplacement plaquettes"}
                                    placeholderTextColor="#94a3b8"
                                    value={newLine.description}
                                    onChangeText={t => setNewLine({ ...newLine, description: t })}
                                />
                            </View>

                            <View className="flex-row gap-4 mb-8">
                                <View className="flex-1">
                                    <Text className="text-slate-500 mb-2 font-medium">Prix Unitaire (€)</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                        placeholder="0.00"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="numeric"
                                        value={newLine.prix_vente_unitaire}
                                        onChangeText={t => setNewLine({ ...newLine, prix_vente_unitaire: t })}
                                    />
                                </View>
                                <View className="w-1/3">
                                    <Text className="text-slate-500 mb-2 font-medium">Quantité</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                        placeholder="1"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="numeric"
                                        value={newLine.quantite}
                                        onChangeText={t => setNewLine({ ...newLine, quantite: t })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleAddLine}
                                disabled={addLineMutation.isPending}
                                className="bg-blue-600 h-14 rounded-xl items-center justify-center shadow-lg shadow-blue-500/30 mb-8"
                            >
                                {addLineMutation.isPending ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Valider</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            )}
        </View>
    );
}
