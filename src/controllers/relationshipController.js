const supabase = require('../config/database');

// Crear una nueva relación (vincular cuidador/familiar con adulto mayor)
const createRelationship = async (req, res) => {
  const { elderly_id, caregiver_id, relationship_type, permissions } = req.body;

  try {
    // Validar que el adulto mayor existe y tiene el rol correcto
    const { data: elderlyData, error: elderlyError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', elderly_id)
      .single();

    if (elderlyError || !elderlyData || !['adultoMayor', 'adulto_mayor'].includes(elderlyData.role)) {
      return res.status(404).json({ error: 'Adulto mayor no encontrado' });
    }

    // Validar que el cuidador/familiar existe y tiene el rol correcto
    const { data: caregiverData, error: caregiverError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', caregiver_id)
      .single();

    if (caregiverError || !caregiverData || !['cuidador', 'familiar'].includes(caregiverData.role)) {
      return res.status(404).json({ error: 'Cuidador o familiar no encontrado' });
    }

    // Validar que el relationship_type coincida con el rol
    const caregiverRole = caregiverData.role;
    if (relationship_type !== caregiverRole) {
      return res.status(400).json({
        error: `El tipo de relación debe ser '${caregiverRole}' para este usuario`
      });
    }

    // Crear la relación
    const { data: newRelation, error: insertError } = await supabase
      .from('user_relationships')
      .insert({
        elderly_id,
        caregiver_id,
        relationship_type,
        permissions: permissions || {
          view_health: true,
          view_medications: true,
          view_appointments: true,
          edit_medications: false,
          edit_appointments: false
        },
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Esta relación ya existe' });
      }
      throw insertError;
    }

    res.status(201).json({
      message: 'Relación creada exitosamente',
      relationship: newRelation
    });
  } catch (error) {
    console.error('Error al crear relación:', error);
    res.status(500).json({ error: 'Error al crear la relación' });
  }
};

// Obtener todos los cuidadores/familiares de un adulto mayor
const getElderlyCaregiversAndFamily = async (req, res) => {
  const { elderly_id } = req.params;

  console.log('Obteniendo relaciones para elderly_id:', elderly_id);

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .select(`
        id,
        relationship_type,
        permissions,
        status,
        created_at,
        caregiver:users!caregiver_id (
          id,
          name,
          email,
          profile_image_url,
          role
        )
      `)
      .eq('elderly_id', elderly_id)
      .in('status', ['active', 'inactive'])
      .order('status', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener relaciones:', error);
      return res.status(500).json({
        error: 'Error al obtener las relaciones',
        message: error.message
      });
    }

    // Transformar los datos
    const relationships = data.map(rel => ({
      id: rel.id,
      elderly_id: parseInt(elderly_id),
      caregiver_id: rel.caregiver.id,
      caregiver_name: rel.caregiver.name,
      caregiver_email: rel.caregiver.email,
      caregiver_profile_image: rel.caregiver.profile_image_url,
      caregiver_role: rel.caregiver.role,
      relationship_type: rel.relationship_type,
      permissions: rel.permissions,
      status: rel.status,
      created_at: rel.created_at
    }));

    console.log('Relaciones encontradas:', relationships.length);

    res.json({
      elderly_id: parseInt(elderly_id),
      relationships
    });
  } catch (error) {
    console.error('Error al obtener relaciones:', error);
    res.status(500).json({
      error: 'Error al obtener las relaciones',
      message: error.message
    });
  }
};

// Obtener todos los adultos mayores asignados a un cuidador/familiar
const getCaregiverElderlyPatients = async (req, res) => {
  const { caregiver_id } = req.params;

  console.log('Obteniendo pacientes para caregiver_id:', caregiver_id);

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .select(`
        id,
        relationship_type,
        permissions,
        status,
        created_at,
        elderly:users!elderly_id (
          id,
          name,
          email,
          cedula,
          profile_image_url
        )
      `)
      .eq('caregiver_id', caregiver_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener pacientes:', error);
      return res.status(500).json({
        error: 'Error al obtener los pacientes',
        message: error.message
      });
    }

    // Transformar los datos
    const patients = data.map(rel => ({
      id: rel.id,
      caregiver_id: parseInt(caregiver_id),
      elderly_id: rel.elderly.id,
      elderly_name: rel.elderly.name,
      elderly_email: rel.elderly.email,
      elderly_cedula: rel.elderly.cedula,
      elderly_profile_image: rel.elderly.profile_image_url,
      relationship_type: rel.relationship_type,
      permissions: rel.permissions,
      status: rel.status,
      created_at: rel.created_at
    }));

    console.log('Pacientes encontrados:', patients.length);

    res.json({
      caregiver_id: parseInt(caregiver_id),
      patients
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({
      error: 'Error al obtener los pacientes',
      message: error.message
    });
  }
};

// Actualizar permisos de una relación
const updateRelationshipPermissions = async (req, res) => {
  const { relationship_id } = req.params;
  const { permissions } = req.body;

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .update({ permissions })
      .eq('id', relationship_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }

    res.json({
      message: 'Permisos actualizados exitosamente',
      relationship: data
    });
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    res.status(500).json({ error: 'Error al actualizar los permisos' });
  }
};

// Cambiar estado de una relación (activar/desactivar)
const updateRelationshipStatus = async (req, res) => {
  const { relationship_id } = req.params;
  const { status } = req.body;

  if (!['pending', 'active', 'inactive'].includes(status)) {
    return res.status(400).json({
      error: 'Estado inválido. Debe ser: pending, active o inactive'
    });
  }

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .update({ status })
      .eq('id', relationship_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      relationship: data
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

// Eliminar una relación
const deleteRelationship = async (req, res) => {
  const { relationship_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .delete()
      .eq('id', relationship_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }

    res.json({
      message: 'Relación eliminada exitosamente',
      relationship: data
    });
  } catch (error) {
    console.error('Error al eliminar relación:', error);
    res.status(500).json({ error: 'Error al eliminar la relación' });
  }
};

// Verificar si un usuario tiene permiso para acceder a la información de un adulto mayor
const checkPermission = async (req, res) => {
  const { caregiver_id, elderly_id, permission_type } = req.query;

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .select('permissions')
      .eq('caregiver_id', caregiver_id)
      .eq('elderly_id', elderly_id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return res.json({ hasPermission: false });
    }

    const permissions = data.permissions;
    const hasPermission = permissions[permission_type] === true;

    res.json({
      hasPermission,
      permissions
    });
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    res.status(500).json({ error: 'Error al verificar los permisos' });
  }
};

// Vincular un cuidador/familiar con un adulto mayor usando la cédula
const linkByCedula = async (req, res) => {
  const { cedula, relationshipType } = req.body;
  const caregiverId = req.user.userId; // Del token JWT
  const userRole = req.user.role; // Rol del usuario autenticado

  console.log('Vinculando - caregiverId:', caregiverId, 'userRole:', userRole, 'cedula:', cedula);

  try {
    // Buscar al adulto mayor por cédula
    const { data: elderlyData, error: elderlyError } = await supabase
      .from('users')
      .select('id, name, role, cedula')
      .eq('cedula', cedula)
      .single();

    console.log('Resultado búsqueda por cédula:', elderlyData, elderlyError);

    if (elderlyError || !elderlyData) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un adulto mayor con esa cédula'
      });
    }

    // Verificar que sea un adulto mayor
    const validRoles = ['adultoMayor', 'adulto_mayor', 'Adulto Mayor'];
    if (!validRoles.includes(elderlyData.role)) {
      return res.status(400).json({
        success: false,
        message: `El usuario con esa cédula no es un adulto mayor (rol: ${elderlyData.role})`
      });
    }

    const elderlyId = elderlyData.id;

    // Verificar si ya existe la relación
    const { data: existingRelation } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('elderly_id', elderlyId)
      .eq('caregiver_id', caregiverId)
      .single();

    if (existingRelation) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una vinculación con este adulto mayor'
      });
    }

    // Determinar el tipo de relación basado en el rol del usuario
    // El trigger de la BD valida que coincida con el rol
    let finalRelationshipType = userRole; // Usar el rol del usuario autenticado

    // Si el usuario envió un relationshipType específico, validar que coincida
    if (relationshipType && relationshipType !== userRole) {
      console.warn(`Tipo de relación solicitado (${relationshipType}) no coincide con rol del usuario (${userRole}). Usando rol del usuario.`);
    }

    console.log('Creando relación con relationship_type:', finalRelationshipType);

    // Crear la relación
    const { data: newRelation, error: insertError } = await supabase
      .from('user_relationships')
      .insert({
        elderly_id: elderlyId,
        caregiver_id: caregiverId,
        relationship_type: finalRelationshipType,
        permissions: {
          view_health: true,
          view_medications: true,
          view_appointments: true,
          edit_medications: false,
          edit_appointments: false
        },
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al insertar relación:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Error al crear la vinculación',
        error: insertError.message
      });
    }

    console.log('Relación creada:', newRelation);

    res.status(201).json({
      success: true,
      message: 'Vinculación exitosa',
      relationship: newRelation,
      elderly: elderlyData
    });
  } catch (error) {
    console.error('Error al vincular por cédula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vincular el perfil',
      error: error.message
    });
  }
};

// Obtener los pacientes vinculados al usuario actual
const getMyPatients = async (req, res) => {
  const caregiverId = req.user.userId;

  console.log('Obteniendo pacientes para caregiverId:', caregiverId);

  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .select(`
        id,
        relationship_type,
        permissions,
        status,
        created_at,
        elderly:users!elderly_id (
          id,
          name,
          email,
          cedula,
          phone,
          profile_image_url
        )
      `)
      .eq('caregiver_id', caregiverId)
      .eq('status', 'active');

    if (error) {
      console.error('Error al obtener pacientes:', error);
      return res.status(500).json({
        error: 'Error al obtener los pacientes',
        message: error.message
      });
    }

    // Transformar los datos para que sean más fáciles de usar
    const patients = data.map(rel => ({
      relationship_id: rel.id,
      id: rel.elderly.id,
      name: rel.elderly.name,
      email: rel.elderly.email,
      cedula: rel.elderly.cedula,
      phone: rel.elderly.phone,
      profile_image_url: rel.elderly.profile_image_url,
      relationship_type: rel.relationship_type,
      permissions: rel.permissions,
      status: rel.status,
      created_at: rel.created_at
    }));

    console.log('Pacientes encontrados:', patients.length);
    res.json(patients);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({
      error: 'Error al obtener los pacientes',
      message: error.message
    });
  }
};

module.exports = {
  createRelationship,
  getElderlyCaregiversAndFamily,
  getCaregiverElderlyPatients,
  updateRelationshipPermissions,
  updateRelationshipStatus,
  deleteRelationship,
  checkPermission,
  linkByCedula,
  getMyPatients
};
