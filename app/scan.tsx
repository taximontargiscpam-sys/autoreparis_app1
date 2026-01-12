import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Box, Check, Info, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null); // { type: 'found' | 'unknown', data: any, code: string }
    const router = useRouter();

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View className="flex-1 justify-center items-center bg-black">
                <Text className="text-white mb-4">Permission caméra requise</Text>
                <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-6 py-3 rounded-full">
                    <Text className="text-white font-bold">Autoriser</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }: any) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);

        try {
            const { data: product, error } = await supabase
                .from('products')
                .select('id, nom, stock_actuel, marque')
                .eq('code_barres', data)
                .maybeSingle();

            if (error) {
                // Technical error
                Alert.alert("Erreur", error.message);
                setScanned(false);
                setLoading(false);
                return;
            }

            if (product) {
                setScanResult({ type: 'found', data: product, code: data });
            } else {
                setScanResult({ type: 'unknown', data: null, code: data });
            }
        } catch (e) {
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setScanResult(null);
        setScanned(false);
    };

    const handleStockIncrement = async () => {
        if (!scanResult?.data) return;
        setLoading(true);

        const newStock = (scanResult.data.stock_actuel || 0) + 1;
        const { error } = await supabase
            .from('products')
            .update({ stock_actuel: newStock })
            .eq('id', scanResult.data.id);

        if (error) {
            Alert.alert("Erreur", "Mise à jour échouée");
        } else {
            // Optimistic update for UI feedback
            setScanResult({
                ...scanResult,
                data: { ...scanResult.data, stock_actuel: newStock }
            });
            // Show brief success feedback then maybe close? Or keep open?
            // User flow: Scan -> +1 -> Scan Next.
            // Let's reset after a short delay or show success state.
            Alert.alert("Succès", "+1 ajouté au stock !", [
                { text: "OK", onPress: handleReset }
            ]);
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-black">
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "upc_a", "code128"],
                }}
            />

            {/* Header / Back Button */}
            <View className="absolute top-12 left-6 z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center">
                    <X color="white" size={24} />
                </TouchableOpacity>
            </View>

            {/* Target Area (Only visible when scanning) */}
            {!scanResult && (
                <View className="flex-1 items-center justify-center">
                    <View className="w-72 h-72 border-2 border-white/50 rounded-3xl items-center justify-center">
                        <View className="w-64 h-64 rounded-2xl border border-white/20" />
                    </View>
                    <Text className="text-white/80 mt-8 font-medium bg-black/60 px-4 py-2 rounded-full overflow-hidden">
                        Scannez un code-barres
                    </Text>
                </View>
            )}

            {/* Loading Overlay */}
            {loading && (
                <View className="absolute inset-0 bg-black/60 items-center justify-center z-20">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            )}

            {/* Result Modal / Overlay */}
            {scanResult && !loading && (
                <View className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl p-6 pb-12 shadow-2xl border-t border-slate-700">
                    {scanResult.type === 'found' ? (
                        <View>
                            <View className="flex-row items-center mb-4">
                                <View className="w-12 h-12 bg-green-500/20 rounded-full items-center justify-center mr-4">
                                    <Check size={24} color="#4ade80" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-xl font-bold">{scanResult.data.nom}</Text>
                                    <Text className="text-slate-400 text-sm">{scanResult.data.marque}</Text>
                                </View>
                            </View>

                            <View className="bg-slate-800 p-4 rounded-xl mb-6 flex-row justify-between items-center">
                                <Text className="text-slate-300">Stock Actuel</Text>
                                <Text className="text-white text-2xl font-bold">{scanResult.data.stock_actuel}</Text>
                            </View>

                            <View className="flex-col gap-3">
                                <TouchableOpacity
                                    onPress={handleStockIncrement}
                                    className="bg-green-600 h-14 rounded-xl flex-row items-center justify-center"
                                >
                                    <Plus color="white" size={20} className="mr-2" />
                                    <Text className="text-white font-bold text-lg">Ajouter (+1)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/products/[id]', params: { id: scanResult.data.id } })}
                                    className="bg-slate-700 h-14 rounded-xl flex-row items-center justify-center"
                                >
                                    <Info color="white" size={20} className="mr-2" />
                                    <Text className="text-white font-bold text-lg">Voir Fiche</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleReset} className="mt-2 h-10 items-center justify-center">
                                    <Text className="text-slate-500 font-medium">Scanner un autre</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <View className="flex-row items-center mb-4">
                                <View className="w-12 h-12 bg-orange-500/20 rounded-full items-center justify-center mr-4">
                                    <Box size={24} color="#fb923c" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-xl font-bold">Produit Inconnu</Text>
                                    <Text className="text-slate-400 text-sm font-mono">{scanResult.code}</Text>
                                </View>
                            </View>

                            <Text className="text-slate-400 mb-6">Ce produit n'est pas encore enregistré dans votre garage.</Text>

                            <View className="flex-col gap-3">
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/products/new', params: { code: scanResult.code } })}
                                    className="bg-blue-600 h-14 rounded-xl flex-row items-center justify-center"
                                >
                                    <Plus color="white" size={20} className="mr-2" />
                                    <Text className="text-white font-bold text-lg">Créer le produit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleReset} className="mt-2 h-10 items-center justify-center">
                                    <Text className="text-slate-500 font-medium">Annuler</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
