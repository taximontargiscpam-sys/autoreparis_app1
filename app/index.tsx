import { Image, Text, TouchableOpacity, View, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Wrench, ArrowRight, Lock, Phone, ShieldCheck, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PublicHomeScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-slate-950">
            {/* Background Ambience */}
            <View className="absolute top-0 left-0 right-0 h-96 opacity-20">
                <LinearGradient
                    colors={['#3b82f6', '#0f172a']}
                    style={{ width: '100%', height: '100%' }}
                />
            </View>

            <SafeAreaView className="flex-1">
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Header / Brand */}
                    <View className="px-6 pt-8 pb-6 flex-row justify-between items-center">
                        <View>
                            <Text className="text-blue-500 font-bold text-sm tracking-widest uppercase">AutoReparis OS</Text>
                            <Text className="text-white text-3xl font-extrabold mt-1">L'Excellence <Text className="text-blue-500">Mécanique</Text></Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/login')}
                            className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center border border-slate-700"
                            accessibilityLabel="Espace Professionnel"
                        >
                            <Lock size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    {/* Hero Section */}
                    <View className="px-6 mt-4">
                        <View className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                            <LinearGradient
                                colors={['rgba(59, 130, 246, 0.1)', 'transparent']}
                                className="absolute inset-0"
                            />
                            <View className="flex-row items-center mb-4">
                                <View className="w-12 h-12 bg-blue-500/20 rounded-2xl items-center justify-center mr-4">
                                    <Car size={24} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text className="text-white text-lg font-bold">Suivre ma réparation</Text>
                                    <Text className="text-slate-400 text-xs">Accès Client Public</Text>
                                </View>
                            </View>

                            <Text className="text-slate-300 mb-6 leading-6">
                                Consultez l'avancement de votre véhicule en temps réel. Entrez simplement votre plaque d'immatriculation.
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.push('/public/search')}
                                className="bg-blue-600 h-14 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-900/50 active:bg-blue-700"
                            >
                                <Text className="text-white font-bold text-lg mr-2">Accéder au Suivi</Text>
                                <ArrowRight size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Services Grid */}
                    <View className="px-6 mt-8">
                        <Text className="text-white text-xl font-bold mb-4">Nos Services</Text>

                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {/* Service 1 */}
                            <View className="w-[48%] bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                <Wrench size={24} color="#fbbf24" className="mb-3" />
                                <Text className="text-white font-bold mb-1">Mécanique</Text>
                                <Text className="text-slate-500 text-xs">Entretien complet et réparations complexes.</Text>
                            </View>

                            {/* Service 2 */}
                            <View className="w-[48%] bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                <ShieldCheck size={24} color="#34d399" className="mb-3" />
                                <Text className="text-white font-bold mb-1">Diagnostic</Text>
                                <Text className="text-slate-500 text-xs">Valise électronique dernière génération.</Text>
                            </View>

                            {/* Service 3 */}
                            <View className="w-[48%] bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                <Car size={24} color="#f87171" className="mb-3" />
                                <Text className="text-white font-bold mb-1">Carrosserie</Text>
                                <Text className="text-slate-500 text-xs">Peinture et débosselage de précision.</Text>
                            </View>

                            {/* Info */}
                            <View className="w-[48%] bg-slate-800/50 p-4 rounded-2xl border border-slate-800 items-center justify-center">
                                <Text className="text-slate-400 text-center text-xs font-bold uppercase tracking-wider">Devis Gratuit</Text>
                                <Text className="text-blue-400 text-center text-2xl font-bold my-1">24h</Text>
                                <Text className="text-slate-500 text-center text-[10px]">Délai moyen</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer Contact */}
                    <View className="px-6 mt-8 mb-8">
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => Linking.openURL('tel:0974999957')}
                            className="bg-slate-900 rounded-2xl p-5 flex-row items-center border border-slate-800"
                        >
                            <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center mr-4">
                                <Phone size={20} color="#94a3b8" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold">Besoin d'un rendez-vous ?</Text>
                                <Text className="text-slate-400 text-sm">Appelez-nous au 09 74 99 99 57</Text>
                            </View>
                            <ArrowRight size={16} color="#475569" />
                        </TouchableOpacity>
                        <View className="mt-4 flex-row items-center justify-center">
                            <MapPin size={14} color="#64748b" className="mr-1" />
                            <Text className="text-slate-500 text-xs">35 Rue du Bon Houdart, 93700 Drancy</Text>
                        </View>
                    </View>

                    {/* Pro Access Link (Bottom) */}
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        className="self-center py-4 px-8"
                    >
                        <Text className="text-slate-600 text-xs font-medium">Espace Professionnel • Employés</Text>
                    </TouchableOpacity>

                    {/* Legal Links - Required by Apple */}
                    <View className="flex-row justify-center items-center mb-6 gap-4">
                        <TouchableOpacity onPress={() => Linking.openURL('https://autoreparis-legal.vercel.app/politique-de-confidentialite.html')}>
                            <Text className="text-slate-600 text-[10px] underline">Politique de confidentialité</Text>
                        </TouchableOpacity>
                        <Text className="text-slate-700 text-[10px]">•</Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://autoreparis-legal.vercel.app/conditions-utilisation.html')}>
                            <Text className="text-slate-600 text-[10px] underline">Conditions d'utilisation</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
