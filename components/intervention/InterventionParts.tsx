import { supabase } from '@/lib/supabase';
import { PenTool, Plus, Trash2, Wrench } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function InterventionParts({ intervention }: any) {
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [newLine, setNewLine] = useState({
        type_ligne: 'piece',
        description: '',
        quantite: '1',
        prix_vente_unitaire: ''
    });

    useEffect(() => {
        fetchLines();

        // Realtime subscription for this intervention's lines
        const subscription = supabase
            .channel(`lines-${intervention.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'intervention_lines', filter: `intervention_id=eq.${intervention.id}` }, fetchLines)
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [intervention.id]);

    const fetchLines = async () => {
        // Dummy data handling
        if (intervention.id.toString().startsWith('dummy')) {
            // For demo purposes, we could pre-fill some lines for specific dummies if we wanted
            // But for now, we just avoid the API call error
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('intervention_lines')
            .select('*')
            .eq('intervention_id', intervention.id);

        if (error) console.error(error);
        else setLines(data || []);
        setLoading(false);
    };

    const handleAddLine = async () => {
        if (!newLine.description || !newLine.prix_vente_unitaire) {
            Alert.alert('Erreur', 'Veuillez remplir la description et le prix.');
            return;
        }

        // Dummy Data Handling
        if (intervention.id.toString().startsWith('dummy')) {
            const dummyLine = {
                id: Math.random().toString(),
                intervention_id: intervention.id,
                type_ligne: newLine.type_ligne,
                description: newLine.description,
                quantite: parseFloat(newLine.quantite.replace(',', '.')),
                prix_vente_unitaire: parseFloat(newLine.prix_vente_unitaire.replace(',', '.')),
                prix_achat_unitaire: 0
            };
            setLines([...lines, dummyLine]);
            setModalVisible(false);
            setNewLine({ type_ligne: 'piece', description: '', quantite: '1', prix_vente_unitaire: '' });
            return;
        }

        const { error } = await supabase.from('intervention_lines').insert([{
            intervention_id: intervention.id,
            type_ligne: newLine.type_ligne,
            description: newLine.description,
            quantite: parseFloat(newLine.quantite.replace(',', '.')),
            prix_vente_unitaire: parseFloat(newLine.prix_vente_unitaire.replace(',', '.')),
            prix_achat_unitaire: 0 // Default for now
        }]);

        if (error) {
            Alert.alert('Erreur', 'Impossible d\'ajouter la ligne');
            console.error(error);
        } else {
            setModalVisible(false);
            setNewLine({ type_ligne: 'piece', description: '', quantite: '1', prix_vente_unitaire: '' });
            // Update parent total (Quick dirty fix, ideally DB trigger or separate update)
            updateParentTotal();
        }
    };

    const updateParentTotal = async () => {
        // Calculate new total locally or fetch? Fetching lines again inside fetchLines will get them, but we need to sum them
        // Let's just trigger a re-calc on the server side or blindly update local for now.
        // For V1, let's just let the UI refresh. The Total on the summary might trail behind unless we force update it.
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Confirmer', 'Supprimer cette ligne ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    // Dummy Data Handling
                    if (intervention.id.toString().startsWith('dummy')) {
                        setLines(lines.filter(l => l.id !== id));
                        return;
                    }

                    await supabase.from('intervention_lines').delete().eq('id', id);
                    updateParentTotal();
                }
            }
        ]);
    };

    const renderLineItem = (item: any) => (
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

                {loading ? <ActivityIndicator /> : lines.map(renderLineItem)}

                {lines.length === 0 && !loading && (
                    <View className="items-center py-10 opacity-50">
                        <Text className="text-slate-500">Aucune pièce ou main d'œuvre ajoutée.</Text>
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
                                <View className="flex-1 py-3 rounded-lg items-center bg-white dark:bg-slate-700 shadow-sm">
                                    <Text className="font-bold text-slate-900 dark:text-white">Pièce 🔩</Text>
                                </View>
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
                                className="bg-blue-600 h-14 rounded-xl items-center justify-center shadow-lg shadow-blue-500/30 mb-8"
                            >
                                <Text className="text-white font-bold text-lg">Valider</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            )}
        </View>
    );
}
