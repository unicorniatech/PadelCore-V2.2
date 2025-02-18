import { supabase } from "./supabase";

/**
 * Sube la imagen al bucket "avatars" en Supabase Storage
 * @param file El archivo File (ej. seleccionado en un input type="file")
 * @param userId El ID del usuario para formar la ruta del archivo
 * @returns La ruta o URL pública de la imagen, o null si hay error
 */
export async function uploadAvatarToSupabase(file: File, userId: string): Promise<string | null> {
    try {
      // Nombre único del archivo, por ej userId + timestamp
      const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `users/${userId}/${fileName}`;
  
      // 1) Subir el archivo
      const { data, error } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
  
      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }
  
      // 2) Obtener URL pública (o “signed URL” si quieres privado)
      // Aquí creamos la URL pública de ese archivo
      const { data: publicData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      if (!publicData?.publicUrl) {
        console.error('No public URL returned');
        return null;
      }
  
      return publicData.publicUrl; 
    } catch (err) {
      console.error('Unhandled error uploading avatar:', err);
      return null;
    }
  }