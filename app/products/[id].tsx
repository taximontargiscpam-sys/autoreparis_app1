import { useProduct, useUpdateStock } from '@/lib/hooks/useProducts';
import { supabase } from '@/lib/supabase';
import type { StockMovement, User } from '@/lib/database.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Minus, Package, Plus, Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MovementWithUser = StockMovement & {
    users: Pick<User, 'nom' | 'prenom'> | null;
};

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const qc = useQueryClient();
    const [stockAdjustment, setStockAdjustment] = useState(0);

    const productId = Array.isArray(id) ? id[0] : id;

    const { data: product, isLoading } = useProduct(productId);
    const updateStock = useUpdateStock();

    const { data: movements = [] } = useQuery<MovementWithUser[]>({
        queryKey: ['stock-movements', productId],
        enabled: !!productId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stock_movements')
                .select('*, users(nom, prenom)')
                .eq('product_id', productId!)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data ?? []) as MovementWithUser[];
        },
    });

    const handleStockUpdate = async () => {
        if (stockAdjustment === 0 || !product) return;

        const newStock = (product.stock_actuel || 0) + stockAdjustment;

        try {
            await updateStock.mutateAsync({
                productId: product.id,
                newStock,
                previousStock: product.stock_actuel,
                motif: 'Ajustement manuel',
            });

            // Also invalidate local movements query
            qc.invalidateQueries({ queryKey: ['stock-movements', productId] });

            Alert.alert('Succes', 'Stock mis a jour');
            setStockAdjustment(0);
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre a jour le stock');
        }
    };

    if (isLoading || !product) {
        return (
            <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#0f172a" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center bg-slate-950 border-b border-slate-900">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-800 p-2 rounded-full">
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>
                    {product?.nom}
                </Text>
                <View className="bg-blue-600 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold uppercase">{product?.categorie || 'DIV'}</Text>
                </View>
            </View>

            <View className="flex-1 bg-slate-950">
                <ScrollView className="flex-1 p-6">
                    {/* Top Icon & Title */}
                    <View className="items-center mb-8 mt-4">
                        <View className="w-24 h-24 bg-slate-900 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-black/50 border border-slate-800">
                            <Package size={40} color="#3b82f6" />
                        </View>
                        <Text className="text-2xl font-bold text-white text-center mb-1">{product?.nom}</Text>
                        <Text className="text-slate-400 font-medium">{product?.reference_fournisseur || 'Sans référence'}</Text>
                        <Text className="text-slate-600 text-xs mt-1 font-mono">{product?.code_barres || 'Sans Code Barre'}</Text>
                    </View>

                    {/* Stock Control Card */}
                    <View className="bg-slate-900 p-6 rounded-3xl border border-slate-800 mb-6 shadow-sm">
                        <Text className="text-center text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Ajustement rapide</Text>

                        <View className="flex-row items-center justify-center gap-6 mb-6">
                            <TouchableOpacity
                                onPress={() => setStockAdjustment(prev => prev - 1)}
                                className="w-12 h-12 rounded-xl bg-slate-800 items-center justify-center border border-slate-700"
                            >
                                <Minus size={24} color="#ef4444" />
                            </TouchableOpacity>

                            <View className="items-center min-w-[60px]">
                                <Text className={`text-3xl font-black ${stockAdjustment !== 0 ? (stockAdjustment > 0 ? 'text-green-500' : 'text-red-500') : 'text-white'}`}>
                                    {stockAdjustment > 0 ? `+${stockAdjustment}` : stockAdjustment}
                                </Text>
                                <Text className="text-[10px] text-slate-500 font-bold uppercase">Delta</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setStockAdjustment(prev => prev + 1)}
                                className="w-12 h-12 rounded-xl bg-slate-800 items-center justify-center border border-slate-700"
                            >
                                <Plus size={24} color="#22c55e" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4">
                            <Text className="text-slate-400 font-medium">Stock Actuel</Text>
                            <Text className={`text-2xl font-black ${product?.stock_actuel <= (product?.stock_min || 0) ? 'text-red-500' : 'text-white'}`}>
                                {product?.stock_actuel}
                            </Text>
                        </View>

                        {stockAdjustment !== 0 && (
                            <TouchableOpacity
                                onPress={handleStockUpdate}
                                className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
                            >
                                <Save size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold">Valider l'ajustement</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Price Cards */}
                    <View className="flex-row gap-3 mb-6">
                        <View className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                            <Text className="text-xs text-slate-500 font-bold uppercase mb-1">Prix Achat</Text>
                            <Text className="text-lg font-black text-white">{product?.prix_achat_unitaire || 0} €</Text>
                        </View>
                        <View className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                            <Text className="text-xs text-slate-500 font-bold uppercase mb-1">Prix Vente</Text>
                            <Text className="text-lg font-black text-white">{product?.prix_vente_unitaire || 0} €</Text>
                        </View>
                    </View>

                    {/* History */}
                    <Text className="text-lg font-bold text-white mb-4 ml-1">Historique des mouvements</Text>
                    {movements.length === 0 ? (
                        <Text className="text-slate-600 text-center italic py-4">Aucun mouvement récent</Text>
                    ) : (
                        movements.map((move) => (
                            <View key={move.id} className="bg-slate-900 p-4 rounded-2xl mb-3 border border-slate-800 flex-row items-start">
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${move.type === 'entree' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {move.type === 'entree' ? <Plus size={18} color="#22c55e" /> : <Minus size={18} color="#ef4444" />}
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="font-bold text-white text-sm">
                                            {move.type === 'entree' ? 'Produit ajouté' : 'Produit retiré'}
                                        </Text>
                                        <Text className={`font-bold text-sm ${move.type === 'entree' ? 'text-green-500' : 'text-red-500'}`}>
                                            {move.type === 'entree' ? '+' : '-'}{move.quantite}
                                        </Text>
                                    </View>
                                    <Text className="text-slate-500 text-xs mt-1">
                                        Stock: {move.stock_avant} → {move.stock_apres} • Par {move.users?.prenom || 'Inconnu'}
                                    </Text>
                                    <Text className="text-slate-600 text-[10px] mt-2">
                                        {new Date(move.created_at).toLocaleString('fr-FR')}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}

                    <View className="h-10" />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
