import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { Package, ScanLine, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StockScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('nom', { ascending: true });

        if (error) console.error(error);

        let fetchedData = data || [];

        // Fallback Dummy Data if empty
        if (fetchedData.length === 0) {
            fetchedData = [
                // Entretien
                { id: 'd1', nom: 'Filtre à Huile Bosch', categorie: 'Entretien', stock_actuel: 15, stock_min: 5, prix_vente_unitaire: 12.90, reference_fournisseur: 'F-001-B' },
                { id: 'd5', nom: 'Huile Castrol 5W30 (5L)', categorie: 'Entretien', stock_actuel: 10, stock_min: 5, prix_vente_unitaire: 59.90, reference_fournisseur: 'C-5W30' },
                { id: 'd10', nom: 'Liquide Refroidissement -30°C', categorie: 'Entretien', stock_actuel: 8, stock_min: 4, prix_vente_unitaire: 14.50, reference_fournisseur: 'L-COOL' },

                // Pneus
                { id: 'd2', nom: 'Pneus Michelin 205/55 R16', categorie: 'Pneus', stock_actuel: 4, stock_min: 8, prix_vente_unitaire: 89.00, reference_fournisseur: 'M-205-55' },

                // Mécanique
                { id: 'd3', nom: 'Plaquettes de Frein Brembo', categorie: 'Mécanique', stock_actuel: 2, stock_min: 2, prix_vente_unitaire: 45.50, reference_fournisseur: 'BR-999' },
                { id: 'd8', nom: 'Amortisseurs Arrière (Paire)', categorie: 'Mécanique', stock_actuel: 1, stock_min: 2, prix_vente_unitaire: 110.00, reference_fournisseur: 'AM-RR-02' },
                { id: 'd9', nom: 'Kit Embrayage Valeo', categorie: 'Mécanique', stock_actuel: 0, stock_min: 1, prix_vente_unitaire: 230.00, reference_fournisseur: 'KB-VAL' },

                // Batterie
                { id: 'd4', nom: 'Batterie Varta 12V 70Ah', categorie: 'Batterie', stock_actuel: 3, stock_min: 2, prix_vente_unitaire: 120.00, reference_fournisseur: 'V-70AH' },

                // Carrosserie
                { id: 'd6', nom: 'Pare-Choc Avant (Peinture à faire)', categorie: 'Carrosserie', stock_actuel: 1, stock_min: 1, prix_vente_unitaire: 180.00, reference_fournisseur: 'PC-AV-01' },
                { id: 'd7', nom: 'Phare LED Avant Droit', categorie: 'Carrosserie', stock_actuel: 0, stock_min: 1, prix_vente_unitaire: 350.00, reference_fournisseur: 'PH-LED-R' },
            ];
        }

        setProducts(fetchedData);
        setLoading(false);
        setRefreshing(false);
    };


    const handleDelete = (id: string, nom: string) => {
        Alert.alert("Supprimer", `Supprimer ${nom} du stock ?`, [
            { text: "Annuler", style: "cancel" },
            {
                text: "Supprimer", style: "destructive",
                onPress: async () => {
                    const { error } = await supabase.from('products').delete().eq('id', id);
                    if (error) Alert.alert("Erreur", error.message);
                    else fetchProducts();
                }
            }
        ]);
    };


    const renderRightActions = (progress: any, dragX: any, id: string, nom: string) => {
        return (
            <TouchableOpacity
                onPress={() => handleDelete(id, nom)}
                className="bg-red-500 justify-center items-center w-16 mb-3 rounded-r-2xl"
            >
                <Trash2 size={24} color="white" />
            </TouchableOpacity>
        );
    };

    const filteredProducts = selectedCategory === 'Tous'
        ? products
        : products.filter(p => (p.categorie || '').toLowerCase() === selectedCategory.toLowerCase());

    const categories = ['Tous', 'Mécanique', 'Carrosserie', 'Entretien', 'Pneus', 'Batterie'];

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-slate-900 dark:text-white font-black text-3xl">Stock</Text>
                    <Text className="text-slate-500 text-sm font-medium">Gérez vos produits et équipements</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/scan')} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                    <ScanLine size={24} color="#0f172a" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 rounded-t-[30px] overflow-hidden">
                {/* Categories */}
                <View className="py-2 mb-2">
                    <FlatList
                        data={categories}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24 }}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedCategory(item)}
                                className={`mr-2 px-5 py-2.5 rounded-full border ${selectedCategory === item ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-bold ${selectedCategory === item ? 'text-white' : 'text-slate-600'}`}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#16a34a" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} />}
                        ListEmptyComponent={
                            <View className="items-center py-20 opacity-50">
                                <Package size={48} color="#cbd5e1" />
                                <Text className="text-slate-500 mt-4 text-center">Aucun produit trouvé dans cette catégorie.</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id, item.nom)}>
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })}
                                    className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-slate-100 shadow-sm"
                                >
                                    {/* Left: Image Placeholder */}
                                    <View className="w-16 h-16 bg-slate-100 rounded-xl items-center justify-center mr-4 border border-slate-200 relative">
                                        <Package size={24} color="#64748b" />
                                        {/* Category Badge */}
                                        <View className="absolute -top-2 -left-2 bg-slate-800 px-1.5 py-0.5 rounded-md">
                                            <Text className="text-[8px] text-white uppercase font-bold">{item.categorie?.substring(0, 3) || 'DIV'}</Text>
                                        </View>
                                    </View>

                                    {/* Center: Info */}
                                    <View className="flex-1 mr-2">
                                        {/* Stock Tag */}
                                        <View className={`self-start px-2 py-0.5 rounded-md mb-1 ${item.stock_actuel <= (item.stock_min || 0) ? 'bg-red-100' : 'bg-green-100'}`}>
                                            <Text className={`text-[10px] font-bold ${item.stock_actuel <= (item.stock_min || 0) ? 'text-red-700' : 'text-green-700'}`}>
                                                {item.stock_actuel} en Stock
                                            </Text>
                                        </View>
                                        <Text className="font-bold text-slate-800 text-base leading-5" numberOfLines={2}>{item.nom}</Text>
                                        <Text className="text-slate-400 text-xs mt-0.5">{item.reference_fournisseur || 'Ref: --'}</Text>
                                    </View>

                                    {/* Right: Price */}
                                    <View className="items-end">
                                        <Text className="font-black text-slate-900 text-lg">{item.prix_vente_unitaire || 0} €</Text>
                                        <Text className="text-slate-400 text-[10px]">Prix vente</Text>
                                    </View>
                                </TouchableOpacity>
                            </Swipeable>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
