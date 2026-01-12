import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Minus, Package, Plus, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stockAdjustment, setStockAdjustment] = useState(0);
    const [movements, setMovements] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchProduct();
            fetchHistory();
        } else {
            router.back();
        }
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);

        // Define Dummy Data (Same as stock.tsx)
        const dummyData: Record<string, any> = {
            'd1': { id: 'd1', nom: 'Filtre à Huile Bosch', categorie: 'Entretien', stock_actuel: 15, stock_min: 5, prix_vente_unitaire: 12.90, reference_fournisseur: 'F-001-B', prix_achat_unitaire: 8.50 },
            'd2': { id: 'd2', nom: 'Pneus Michelin 205/55 R16', categorie: 'Pneus', stock_actuel: 4, stock_min: 8, prix_vente_unitaire: 89.00, reference_fournisseur: 'M-205-55', prix_achat_unitaire: 65.00 },
            'd3': { id: 'd3', nom: 'Plaquettes de Frein Brembo', categorie: 'Mécanique', stock_actuel: 2, stock_min: 2, prix_vente_unitaire: 45.50, reference_fournisseur: 'BR-999', prix_achat_unitaire: 25.00 },
            'd4': { id: 'd4', nom: 'Batterie Varta 12V 70Ah', categorie: 'Batterie', stock_actuel: 3, stock_min: 2, prix_vente_unitaire: 120.00, reference_fournisseur: 'V-70AH', prix_achat_unitaire: 80.00 },
            'd5': { id: 'd5', nom: 'Huile Castrol 5W30 (5L)', categorie: 'Entretien', stock_actuel: 10, stock_min: 5, prix_vente_unitaire: 59.90, reference_fournisseur: 'C-5W30', prix_achat_unitaire: 35.00 },
            'd6': { id: 'd6', nom: 'Pare-Choc Avant (Peinture)', categorie: 'Carrosserie', stock_actuel: 1, stock_min: 1, prix_vente_unitaire: 180.00, reference_fournisseur: 'PC-AV-01', prix_achat_unitaire: 120.00 },
            'd7': { id: 'd7', nom: 'Phare LED Avant Droit', categorie: 'Carrosserie', stock_actuel: 0, stock_min: 1, prix_vente_unitaire: 350.00, reference_fournisseur: 'PH-LED-R', prix_achat_unitaire: 240.00 },
            'd8': { id: 'd8', nom: 'Amortisseurs Arrière (Paire)', categorie: 'Mécanique', stock_actuel: 1, stock_min: 2, prix_vente_unitaire: 110.00, reference_fournisseur: 'AM-RR-02', prix_achat_unitaire: 75.00 },
            'd9': { id: 'd9', nom: 'Kit Embrayage Valeo', categorie: 'Mécanique', stock_actuel: 0, stock_min: 1, prix_vente_unitaire: 230.00, reference_fournisseur: 'KB-VAL', prix_achat_unitaire: 150.00 },
            'd10': { id: 'd10', nom: 'Liquide Refroidissement -30°C', categorie: 'Entretien', stock_actuel: 8, stock_min: 4, prix_vente_unitaire: 14.50, reference_fournisseur: 'L-COOL', prix_achat_unitaire: 9.00 },
        };

        const idStr = Array.isArray(id) ? id[0] : id;
        if (idStr && dummyData[idStr]) {
            setProduct(dummyData[idStr]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            Alert.alert('Erreur', 'Produit introuvable');
            router.back();
        } else {
            setProduct(data);
        }
        setLoading(false);
    };

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*, users(nom, prenom)')
            .eq('product_id', id)
            .order('created_at', { ascending: false });

        if (!error) setMovements(data || []);
    };

    const handleStockUpdate = async () => {
        if (stockAdjustment === 0) return;

        const newStock = (product.stock_actuel || 0) + stockAdjustment;

        // Dummy Data Handling
        if (product.id.toString().startsWith('d')) {
            // Update local product state
            setProduct((prev: any) => ({ ...prev, stock_actuel: newStock }));

            // Add dummy movement
            const newMovement = {
                id: Math.random().toString(),
                type: stockAdjustment > 0 ? 'entree' : 'sortie',
                quantite: Math.abs(stockAdjustment),
                stock_avant: product.stock_actuel,
                stock_apres: newStock,
                created_at: new Date().toISOString(),
                users: { prenom: 'Moi (Demo)' }
            };
            setMovements([newMovement, ...movements]);

            Alert.alert('Succès', 'Stock mis à jour (Simulation)');
            setStockAdjustment(0);
            return;
        }

        // 1. Update product stock
        const { error } = await supabase
            .from('products')
            .update({ stock_actuel: newStock })
            .eq('id', id);

        // 2. Log movement
        if (!error) {
            // Get current user ID if possible, for now simplify
            const { data: { user } } = await supabase.auth.getUser();

            await supabase.from('stock_movements').insert([{
                product_id: id,
                type: stockAdjustment > 0 ? 'entree' : 'sortie',
                quantite: Math.abs(stockAdjustment),
                motif: 'Ajustement manuel',
                stock_avant: product.stock_actuel,
                stock_apres: newStock,
                user_id: user?.id
            }]);

            Alert.alert('Succès', 'Stock mis à jour');
            fetchProduct();
            fetchHistory(); // Refresh history
            setStockAdjustment(0);
        } else {
            Alert.alert('Erreur', 'Impossible de mettre à jour le stock');
        }
    };

    if (loading) {
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
                                        {new Date(move.created_at).toLocaleString()}
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
