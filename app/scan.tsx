import { useProductByBarcode, useUpdateStock } from '@/lib/hooks/useProducts';
import type { Product } from '@/lib/database.types';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Box, Check, Info, Plus, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ScanResult = {
    type: 'found' | 'unknown';
    product: Product | null;
    code: string;
};

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scannedCode, setScannedCode] = useState<string | undefined>(undefined);
    const router = useRouter();

    const { data: foundProduct, isLoading: lookupLoading } = useProductByBarcode(scannedCode);
    const updateStock = useUpdateStock();

    // When the barcode query resolves, update scanResult
    const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        setScannedCode(data);
    }, [scanned]);

    // React to query result changes: once lookup finishes, show the result panel
    // We use a small effect-like pattern driven by state transitions
    const isLookupDone = scannedCode !== undefined && !lookupLoading;
    if (isLookupDone && !scanResult) {
        if (foundProduct) {
            setScanResult({ type: 'found', product: foundProduct, code: scannedCode! });
        } else {
            setScanResult({ type: 'unknown', product: null, code: scannedCode! });
        }
    }

    const handleReset = () => {
        setScanResult(null);
        setScanned(false);
        setScannedCode(undefined);
    };

    const handleStockIncrement = async () => {
        if (!scanResult?.product) return;

        const product = scanResult.product;
        const newStock = (product.stock_actuel || 0) + 1;

        try {
            await updateStock.mutateAsync({
                productId: product.id,
                newStock,
                previousStock: product.stock_actuel,
                motif: 'Scan +1',
            });

            // Optimistic UI update for immediate feedback
            setScanResult({
                ...scanResult,
                product: { ...product, stock_actuel: newStock },
            });

            Alert.alert("Succes", "+1 ajoute au stock !", [
                { text: "OK", onPress: handleReset }
            ]);
        } catch {
            Alert.alert("Erreur", "Mise a jour echouee");
        }
    };

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

    const loading = lookupLoading || updateStock.isPending;

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
            {!scanResult && !loading && (
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
                                    <Text className="text-white text-xl font-bold">{scanResult.product!.nom}</Text>
                                    <Text className="text-slate-400 text-sm">{scanResult.product!.reference_fournisseur}</Text>
                                </View>
                            </View>

                            <View className="bg-slate-800 p-4 rounded-xl mb-6 flex-row justify-between items-center">
                                <Text className="text-slate-300">Stock Actuel</Text>
                                <Text className="text-white text-2xl font-bold">{scanResult.product!.stock_actuel}</Text>
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
                                    onPress={() => router.push({ pathname: '/products/[id]', params: { id: scanResult.product!.id } })}
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
