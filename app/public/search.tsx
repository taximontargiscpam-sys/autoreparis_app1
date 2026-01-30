import { ArrowRight, Search, ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function PublicSearchScreen() {
  const [immatriculation, setImmatriculation] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!immatriculation.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une plaque d\'immatriculation.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      // Clean input: remove spaces/hyphens, uppercase
      const cleanPlate = immatriculation.replace(/[\s-]/g, '').toUpperCase();

      // Search for vehicle by plate

      // 1. Find vehicle ID
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .ilike('immatriculation', cleanPlate) // Use ilike or handle formatting exactly in DB
        .single();

      if (vehicleError || !vehicle) {
        throw new Error("Véhicule introuvable. Vérifiez l'immatriculation.");
      }

      // 2. Find ACTIVE intervention for this vehicle
      // We look for interventions that are NOT 'terminee' OR the last modified one
      const { data: intervention, error: interventionError } = await supabase
        .from('interventions')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (interventionError || !intervention) {
        throw new Error("Aucune intervention trouvée pour ce véhicule.");
      }

      // found! navigate to tracking
      router.push({
        pathname: '/tracking',
        params: { id: intervention.id }
      });

    } catch (err: any) {
      // Search error handled
      Alert.alert('Recherche', err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-slate-900">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4">
             <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center border border-slate-700"
            >
                <ArrowLeft color="white" size={20} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-center px-8">
            <View className="items-center mb-10">
              <View className="w-20 h-20 bg-blue-500/20 rounded-3xl items-center justify-center mb-6 border border-blue-500/50 shadow-lg shadow-blue-500/20">
                <Search size={40} color="#3b82f6" />
              </View>
              <Text className="text-3xl font-black text-white text-center mb-2">Suivi de Véhicule</Text>
              <Text className="text-slate-400 text-center text-base">
                Entrez votre plaque d'immatriculation pour voir l'avancement des réparations.
              </Text>
            </View>

            <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
              <Text className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2 ml-1">
                Immatriculation
              </Text>
              
              <View className="flex-row items-center bg-slate-900 border border-slate-700 rounded-2xl h-16 px-4 mb-6">
                 {/* Plate Icon or Country Strip could go here for style */}
                 <View className="w-4 h-8 bg-blue-700 rounded-sm mr-4" />
                 
                 <TextInput
                    className="flex-1 text-white text-2xl font-bold uppercase tracking-widest"
                    placeholder="AA-123-BB"
                    placeholderTextColor="#475569"
                    value={immatriculation}
                    onChangeText={setImmatriculation}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onSubmitEditing={handleSearch}
                 />
              </View>

              <TouchableOpacity
                onPress={handleSearch}
                disabled={loading}
                className={`h-14 rounded-2xl flex-row items-center justify-center ${loading ? 'bg-slate-700' : 'bg-blue-600'} shadow-lg shadow-blue-600/20`}
              >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <Text className="text-white font-bold text-lg mr-2">Rechercher</Text>
                        <ArrowRight size={20} color="white" />
                    </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}
