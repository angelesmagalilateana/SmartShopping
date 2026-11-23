import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickPhoto(source: 'camera' | 'library'): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    // Web must open the picker directly from the user's click. The browser owns
    // access consent; Expo's web permission methods do not request OS permission.
    if (Platform.OS !== 'web') {
      let permission = await (source === 'camera' ? ImagePicker.getCameraPermissionsAsync() : ImagePicker.getMediaLibraryPermissionsAsync());
      if (!permission.granted && permission.canAskAgain) {
        permission = await (source === 'camera' ? ImagePicker.requestCameraPermissionsAsync() : ImagePicker.requestMediaLibraryPermissionsAsync());
      }
      if (!permission.granted) {
        throw new Error(permission.canAskAgain
          ? 'Permiso denegado. Para asociar una foto, permití el acceso e intentá nuevamente.'
          : 'Permiso bloqueado. Habilitá el acceso en los ajustes del dispositivo y volvé a intentar.');
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, base64: false };
    const result = await (source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options));
    if (result.canceled) return null;
    if (!result.assets?.[0]?.uri) throw new Error('No se recibió una imagen válida.');
    return result.assets[0];
  } catch (error) {
    if (error instanceof Error && /Permiso|imagen válida/.test(error.message)) throw error;
    throw new Error('No se pudo abrir la cámara o galería. Verificá que esté disponible y volvé a intentar.');
  }
}
