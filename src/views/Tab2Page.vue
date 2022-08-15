<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
            <ion-title>Photo Gallery</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content :fullscreen="true">
            <ion-grid>
                <ion-row>
                    <ion-col size="6" v-for="photo in photos" :key="photo">
                        <ion-img :src="photo.webviewPath" @click="showActionSheet(photo)"></ion-img>
                    </ion-col>
                </ion-row>
            </ion-grid>
            <ion-fab vertical="bottom" horizontal="center" slot="fixed">
                <ion-fab-button @click="takePhoto">
                <ion-icon :icon="camera"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    </ion-page>
</template>

<script lang="ts">
import {
    actionSheetController,
    toastController,
    IonPage,
    IonHeader,
    IonFab,
    IonFabButton,
    IonIcon,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
} from '@ionic/vue';

import { defineComponent } from 'vue';
import { camera, trash, close } from 'ionicons/icons';

import { usePhotoGallery, UserPhoto } from '@/composables/usePhotoGallery';

export default defineComponent({
    name: 'Tab2Page',
    components: {
        IonPage,
        IonHeader,
        IonFab,
        IonFabButton,
        IonIcon,
        IonToolbar,
        IonTitle,
        IonContent,
        IonGrid,
        IonRow,
        IonCol,
        IonImg,
    },
    setup() {
        const { photos, takePhoto, deletePhoto } = usePhotoGallery();

        const openToast = async () => {
            const toast = await toastController.create({
                message: 'Photo has been deleted',
                duration: 2500,
            });
            return toast.present();
        };

        const showActionSheet = async (photo: UserPhoto) => {
            const actionSheet = await actionSheetController.create({
                header: 'Photos',
                buttons: [
                    {
                        text: 'Delete',
                        role: 'destructive',
                        icon: trash,
                        handler: async () => {
                            await deletePhoto(photo);
                            await openToast();
                        },
                    },
                    {
                        text: 'Cancel',
                        icon: close,
                        role: 'cancel',
                        handler: () => {
                            // Nothing to do, action sheet is automatically closed
                        },
                    }
                ],
            });

            await actionSheet.present();
        };

        return {
            camera,
            trash,
            close,
            photos,
            takePhoto,
            showActionSheet,
        }
    }
});
</script>
