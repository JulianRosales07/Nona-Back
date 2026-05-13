const supabase = require('../config/database');

// Subir foto de perfil
const uploadProfileImage = async (req, res) => {
  try {
    const { userId, imageBase64, fileName } = req.body;

    if (!userId || !imageBase64 || !fileName) {
      return res.status(400).json({ 
        error: 'userId, imageBase64 y fileName son requeridos' 
      });
    }

    // Convertir base64 a buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generar nombre único para el archivo
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${uniqueFileName}`;

    // Subir imagen a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return res.status(500).json({ 
        error: 'Error al subir la imagen', 
        details: uploadError.message 
      });
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Actualizar URL en la base de datos
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ profile_image_url: publicUrl })
      .eq('id', userId)
      .select('id, name, email, profile_image_url')
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ 
        error: 'Error al actualizar el perfil', 
        details: updateError.message 
      });
    }

    res.json({ 
      message: 'Imagen subida exitosamente',
      user: updateData,
      imageUrl: publicUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar foto de perfil
const deleteProfileImage = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Obtener la URL actual de la imagen
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('profile_image_url')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return res.status(500).json({ 
        error: 'Error al obtener usuario', 
        details: fetchError.message 
      });
    }

    // Si hay una imagen, eliminarla del storage
    if (userData.profile_image_url) {
      // Extraer el path del archivo de la URL
      const urlParts = userData.profile_image_url.split('/');
      const filePath = `profile-images/${urlParts[urlParts.length - 1]}`;

      const { error: deleteError } = await supabase
        .storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.error('Error deleting from storage:', deleteError);
        // Continuar aunque falle el borrado del storage
      }
    }

    // Actualizar la base de datos para remover la URL
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ profile_image_url: null })
      .eq('id', userId)
      .select('id, name, email, profile_image_url')
      .single();

    if (updateError) {
      return res.status(500).json({ 
        error: 'Error al actualizar el perfil', 
        details: updateError.message 
      });
    }

    res.json({ 
      message: 'Imagen eliminada exitosamente',
      user: updateData
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Subir imagen de medicamento
const uploadMedicineImage = async (req, res) => {
  try {
    let buffer;
    let fileExt;
    let patientId = req.body.patientId || 'global';

    // Soporte para multipart/form-data (vía multer)
    if (req.file) {
      buffer = req.file.buffer;
      fileExt = req.file.originalname.split('.').pop();
    } 
    // Soporte para base64 (vía JSON)
    else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      fileExt = req.body.fileName ? req.body.fileName.split('.').pop() : 'jpg';
    } 
    else {
      return res.status(400).json({ 
        error: 'Se requiere un archivo (image) o imageBase64' 
      });
    }

    // Generar nombre único para el archivo
    const uniqueFileName = `medicine_${patientId}_${Date.now()}.${fileExt}`;
    const filePath = `medicine-images/${uniqueFileName}`;

    // Subir imagen a Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading medicine image:', uploadError);
      return res.status(500).json({ 
        error: 'Error al subir la imagen', 
        details: uploadError.message 
      });
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    res.json({ 
      message: 'Imagen subida exitosamente',
      url: urlData.publicUrl
    });

  } catch (error) {
    console.error('Upload medicine image error:', error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = { uploadProfileImage, deleteProfileImage, uploadMedicineImage };
