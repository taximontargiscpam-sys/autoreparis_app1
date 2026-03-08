import { useCreateProduct } from '@/lib/hooks/useProducts';
import { productSchema, getValidationError } from '@/lib/validations';
import type { ProductCategory } from '@/lib/database.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Barcode, Box, Calculator, MapPin, Save, Tag } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewProductScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const initialCode = params.code ? (Array.isArray(params.code) ? params.code[0] : params.code) : '';

    const createProduct = useCreateProduct();

    const [form, setForm] = useState({
        nom: '',
        marque: '',
        reference: '',
        code_barres: initialCode,
        stock_actuel: '0',
        stock_minimum: '0',
        prix_achat: '',
        prix_vente: '',
        emplacement: '',
        categorie: 'Mécanique'
    });

    const handleCreate = async () => {
        // Map display category to lowercase DB value
        const categoryMap: Record<string, ProductCategory> = {
            'Mécanique': 'mecanique',
            'Carrosserie': 'carrosserie',
            'Entretien': 'entretien',
            'Pneus': 'pneus',
            'Batterie': 'batterie',
            'Autre': 'autre',
        };

        const payload = {
            nom: form.nom.trim(),
            categorie: categoryMap[form.categorie] ?? 'autre',
            code_barres: form.code_barres.trim() || undefined,
            reference_fournisseur: form.reference.trim() || undefined,
            prix_achat_unitaire: parseFloat(form.prix_achat) || 0,
            prix_vente_unitaire: parseFloat(form.prix_vente) || 0,
            stock_actuel: parseInt(form.stock_actuel) || 0,
            stock_min: parseInt(form.stock_minimum) || 0,
            localisation: form.emplacement.trim() || undefined,
        };

        // Validate with Zod
        const result = productSchema.safeParse(payload);
        const error = getValidationError(result);
        if (error) {
            Alert.alert('Validation', error);
            return;
        }

        try {
            await createProduct.mutateAsync({
                nom: payload.nom,
                categorie: payload.categorie as ProductCategory,
                code_barres: payload.code_barres ?? null,
                reference_fournisseur: payload.reference_fournisseur ?? null,
                prix_achat_unitaire: payload.prix_achat_unitaire,
                prix_vente_unitaire: payload.prix_vente_unitaire,
                stock_actuel: payload.stock_actuel,
                stock_min: payload.stock_min,
                localisation: payload.localisation ?? null,
            });

            Alert.alert('Succès', 'Produit créé avec succès', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/stock') }
            ]);
        } catch (err: unknown) {
            Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
        }
    };

    const loading = createProduct.isPending;

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="px-6 pt-2 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                    <ArrowLeft size={24} className="text-slate-900 dark:text-white" color={Platform.OS === 'ios' ? undefined : 'white'} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 dark:text-white">Nouveau Produit</Text>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Basic Info */}
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-6 border border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-500 font-bold uppercase text-xs mb-4 tracking-wider">Informations Principales</Text>

                        {/* Designation */}
                        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 mb-4">
                            <Tag size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 dark:text-white font-medium text-base"
                                placeholder="Désignation (ex: Filtre à Huile)"
                                placeholderTextColor="#94a3b8"
                                value={form.nom}
                                onChangeText={t => setForm({ ...form, nom: t })}
                            />
                        </View>

                        {/* Marque */}
                        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 mb-4">
                            <Box size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                                placeholder="Marque (ex: Bosch)"
                                placeholderTextColor="#94a3b8"
                                value={form.marque}
                                onChangeText={t => setForm({ ...form, marque: t })}
                            />
                        </View>

                        {/* Code Barres & Ref */}
                        <View className="flex-row space-x-3 mb-4 gap-3">
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                                <View className="flex-row items-center mb-1">
                                    <Barcode size={16} color="#94a3b8" />
                                    <Text className="text-xs text-slate-500 ml-2 font-bold uppercase">Code Barres</Text>
                                </View>
                                <TextInput
                                    className="text-slate-900 dark:text-white font-mono text-sm"
                                    placeholder="Scannez..."
                                    placeholderTextColor="#94a3b8"
                                    value={form.code_barres}
                                    onChangeText={t => setForm({ ...form, code_barres: t })}
                                />
                            </View>
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-xs text-slate-500 font-bold uppercase">Référence</Text>
                                </View>
                                <TextInput
                                    className="text-slate-900 dark:text-white text-sm"
                                    placeholder="Ref interne"
                                    placeholderTextColor="#94a3b8"
                                    value={form.reference}
                                    onChangeText={t => setForm({ ...form, reference: t })}
                                />
                            </View>
                        </View>
                    </View>


                    {/* Category Selector */}
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-6 border border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-500 font-bold uppercase text-xs mb-4 tracking-wider">Catégorie</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {['Mécanique', 'Carrosserie', 'Entretien', 'Pneus', 'Batterie', 'Autre'].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setForm({ ...form, categorie: cat })}
                                    className={`px-4 py-2 rounded-full border ${form.categorie === cat ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                                >
                                    <Text className={`font-medium ${form.categorie === cat ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Pricing & Stock */}
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-6 border border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-500 font-bold uppercase text-xs mb-4 tracking-wider">Stock & Prix</Text>


                        <View className="flex-row space-x-3 mb-4 gap-3">
                            {/* Prix Vente */}
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-green-500/20">
                                <View className="flex-row items-center mb-1">
                                    <Text className="text-green-500 font-bold text-base">€</Text>
                                    <Text className="text-xs text-green-600 dark:text-green-400 ml-2 font-bold uppercase">Prix Vente TTC</Text>
                                </View>
                                <TextInput
                                    className="text-slate-900 dark:text-white font-bold text-lg"
                                    placeholder="0.00"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={form.prix_vente}
                                    onChangeText={t => setForm({ ...form, prix_vente: t })}
                                />
                            </View>

                            {/* Stock Actuel */}
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                                <View className="flex-row items-center mb-1">
                                    <Calculator size={16} color="#94a3b8" />
                                    <Text className="text-xs text-slate-500 ml-2 font-bold uppercase">Stock Actuel</Text>
                                </View>
                                <TextInput
                                    className="text-slate-900 dark:text-white font-bold text-lg"
                                    placeholder="0"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={form.stock_actuel}
                                    onChangeText={t => setForm({ ...form, stock_actuel: t })}
                                />
                            </View>
                        </View>

                        <View className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                            <View className="flex-row items-center mb-1">
                                <MapPin size={16} color="#94a3b8" />
                                <Text className="text-xs text-slate-500 ml-2 font-bold uppercase">Emplacement</Text>
                            </View>
                            <TextInput
                                className="text-slate-900 dark:text-white text-base"
                                placeholder="Etagère, Allée..."
                                placeholderTextColor="#94a3b8"
                                value={form.emplacement}
                                onChangeText={t => setForm({ ...form, emplacement: t })}
                            />
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={loading}
                    className={`nav-button bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/30 ${loading ? 'opacity-50' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg">Créer le produit</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
