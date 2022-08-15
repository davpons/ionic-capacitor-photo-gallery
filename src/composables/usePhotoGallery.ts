import { ref, onMounted, watch } from 'vue';
import { isPlatform } from '@ionic/vue';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface UserPhoto {
    filePath: string,
    webviewPath: string,
}

export function usePhotoGallery() {
    const photos = ref<UserPhoto[]>([]);

    const takePhoto = async () => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 80,
        });

        const savedFileImage: UserPhoto = await savePicture(photo);
        photos.value = [savedFileImage, ...photos.value];
    }

    const PHOTO_STORAGE = 'photos';

    const cachePhotos = async () => {
        await Preferences.set({
            key: PHOTO_STORAGE,
            value: JSON.stringify(photos.value),
        });
    };

    watch(photos, cachePhotos);

    const loadSaved = async () => {
        const photoList = await Preferences.get({ key: PHOTO_STORAGE });
        const photosInStorage = photoList.value ? JSON.parse(photoList.value) : [];

        if (!isPlatform('hybrid')) {
            for (const photo of photosInStorage) {
                const file = await Filesystem.readFile({
                    path: photo.filePath,
                    directory: Directory.Data,
                })
                // Web platform only: Load the photo as base64 data
                photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
            }
        }
        photos.value = photosInStorage;
    };

    onMounted(loadSaved);

    const convertBlobToBase64 = (blob: Blob) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                resolve(reader.result)
            };
            reader.readAsDataURL(blob);
        });

    const savePicture = async (photo: Photo): Promise<UserPhoto> => {
        let base64data: string;
        let fileName: string;

        if (isPlatform('hybrid')) {
            if (!photo.path) {
                throw new Error('Photo path not found');
            }
            const file = await Filesystem.readFile({
                path: photo.path,
            });
            base64data = file.data;
            fileName = photo.path;
        } else {
            // Obtener la foto, leerla como un blob y luego convertirla al formato base64
            if (!photo.webPath) {
                throw Error('Photo path not found');
            }
            const response = await fetch(photo.webPath);
            const blob = await response.blob();
            base64data = (await convertBlobToBase64(blob)) as string;
            fileName = photo.webPath;
        }

        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64data,
            directory: Directory.Data,
            recursive: true,
        });

        if (isPlatform('hybrid')) {
            // Display the new image by rewriting the 'file://' path to HTTP
            // Details: https://ionicframework.com/docs/building/webview#file-protocol
            return {
                filePath: fileName,
                webviewPath: Capacitor.convertFileSrc(savedFile.uri),
            }
        } else {
            // Usa webPath para mostrar la nueva imagen en lugar de base64, ya que ya está cargada en la memoria
            if (!photo.webPath) {
                throw new Error('Photo path not found');
            }
            return {
                filePath: fileName,
                webviewPath: photo.webPath,
            }
        }

    };

    const deletePhoto = async (photo: UserPhoto) => {
        // Remove this photo from the Photos reference data array
        photos.value = photos.value.filter(p => p.filePath !== photo.filePath);

        // delete photo file from filesystem
        // const fileName = photo.filePath.substring(photo.filePath.lastIndexOf('/') + 1);
        // Omitir directory parámetro para usar una ruta de archivo completa ;
        await Filesystem.deleteFile({
            path: photo.filePath,
            //directory: Directory.Data,
        });

    };

    return {
        photos,
        takePhoto,
        deletePhoto,
    }
}