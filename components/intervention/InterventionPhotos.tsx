import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as LucideImage, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function InterventionPhotos({ intervention }: any) {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPhotos();
        const subscription = supabase
            .channel(`photos-${intervention.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_photos', filter: `intervention_id=eq.${intervention.id}` }, fetchPhotos)
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [intervention.id]);

    const fetchPhotos = async () => {
        // Dummy Handling
        if (intervention.id.toString().startsWith('dummy')) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('vehicle_photos')
            .select('*')
            .eq('intervention_id', intervention.id)
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setPhotos(data || []);
        setLoading(false);
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de la caméra pour prendre des photos.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0].uri);
        }
    };

    const handleUpload = async (uri: string) => {
        setUploading(true);

        // Dummy Handling
        if (intervention.id.toString().startsWith('dummy')) {
            const newPhoto = {
                id: Math.random().toString(),
                intervention_id: intervention.id,
                url_image: uri,
                type: 'photo_constat',
                commentaire: 'Ajouté depuis l\'app',
                created_at: new Date().toISOString()
            };
            // Simulate delay
            setTimeout(() => {
                setPhotos([newPhoto, ...photos]);
                setUploading(false);
            }, 500);
            return;
        }

        // SIMULATED UPLOAD: In a real app, we would upload the file to Supabase Storage here.
        // For this demo, we save the local URI (Works on same device) or use a placeholder if needed.
        // We'll trust the local URI for the demo.

        const { error } = await supabase.from('vehicle_photos').insert([{
            intervention_id: intervention.id,
            url_image: uri,
            type: 'photo_constat',
            commentaire: 'Ajouté depuis l\'app'
        }]);

        if (error) {
            Alert.alert('Erreur', 'Impossible de sauvegarder la photo');
            console.error(error);
        }

        setUploading(false);
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Supprimer', 'Voulez-vous supprimer cette photo ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    // Dummy Handling
                    if (intervention.id.toString().startsWith('dummy')) {
                        setPhotos(photos.filter(p => p.id !== id));
                        return;
                    }

                    await supabase.from('vehicle_photos').delete().eq('id', id);
                }
            }
        ]);
    };

    return (
        <ScrollView className="flex-1 p-6">
            <View className="flex-row justify-between items-end mb-6">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">Galerie Photo</Text>
                <Text className="text-slate-500 text-sm">{photos.length} photos</Text>
            </View>

            {loading ? (
                <ActivityIndicator />
            ) : (
                <View className="flex-row flex-wrap justify-between">
                    {photos.map((photo) => (
                        <View key={photo.id} className="w-[48%] mb-4 bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-700 shadow-sm relative">
                            <Image
                                source={{ uri: photo.url_image }}
                                className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-900"
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                onPress={() => handleDelete(photo.id)}
                                className="absolute top-1 right-1 bg-black/50 w-8 h-8 rounded-full items-center justify-center p-1"
                            >
                                <Trash2 size={14} color="white" />
                            </TouchableOpacity>
                            <Text className="text-slate-500 text-xs mt-2 text-center" numberOfLines={1}>
                                {new Date(photo.created_at).toLocaleTimeString()}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {!loading && photos.length === 0 && (
                <View className="items-center py-10 opacity-50">
                    <Camera size={48} color="#cbd5e1" />
                    <Text className="text-slate-500 mt-4 text-center">Aucune photo pour le moment.</Text>
                </View>
            )}

            <View className="h-24" />

            <View className="absolute top-[80%] right-0 left-0 flex-row justify-center gap-4 px-6">
                <TouchableOpacity
                    onPress={pickImage}
                    disabled={uploading}
                    className="flex-1 bg-slate-800 dark:bg-white h-14 rounded-2xl flex-row items-center justify-center shadow-lg relative"
                >
                    {uploading ? <ActivityIndicator color="white" /> : (
                        <>
                            <View className="absolute left-4">
                                <LucideImage size={24} className="text-white dark:text-slate-900" />
                            </View>
                            <Text className="text-white dark:text-slate-900 font-bold text-lg text-center w-full">Galerie</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={takePhoto}
                    disabled={uploading}
                    className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-900/20 relative"
                >
                    <View className="absolute left-4">
                        <Camera color="white" size={24} />
                    </View>
                    <Text className="text-white font-bold text-lg text-center w-full">Caméra</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
