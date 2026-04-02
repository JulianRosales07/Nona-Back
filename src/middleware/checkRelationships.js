const supabase = require('../config/database');

/**
 * Verifica si un adulto mayor tiene relaciones activas con cuidadores o familiares
 * @param {number} elderlyId - ID del adulto mayor
 * @returns {Promise<boolean>} - true si tiene relaciones activas, false si no
 */
const hasActiveRelationships = async (elderlyId) => {
    try {
        const { data, error } = await supabase
            .from('user_relationships')
            .select('id')
            .eq('elderly_id', elderlyId)
            .eq('status', 'active')
            .limit(1);

        if (error) {
            console.error('Error checking relationships:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Error in hasActiveRelationships:', error);
        return false;
    }
};

/**
 * Verifica si un usuario tiene permiso para gestionar datos de un paciente
 * Reglas:
 * - Si el usuario es el mismo paciente Y no tiene relaciones activas: permitido
 * - Si el usuario es cuidador/familiar con relación activa: permitido
 * - Cualquier otro caso: denegado
 * 
 * @param {number} userId - ID del usuario que intenta la acción
 * @param {number} patientId - ID del paciente cuyos datos se quieren gestionar
 * @param {string} userRole - Rol del usuario
 * @returns {Promise<{allowed: boolean, reason: string}>}
 */
const canManagePatientData = async (userId, patientId, userRole) => {
    // Si el usuario es el mismo paciente
    if (userId === patientId) {
        // Verificar si es adulto mayor
        if (['adultoMayor', 'adulto_mayor', 'Adulto Mayor'].includes(userRole)) {
            // Verificar si tiene relaciones activas
            const hasRelations = await hasActiveRelationships(patientId);
            
            if (hasRelations) {
                return {
                    allowed: false,
                    reason: 'El adulto mayor tiene cuidadores o familiares vinculados. Solo ellos pueden gestionar medicamentos y citas.'
                };
            }
            
            // No tiene relaciones, puede gestionar sus propios datos
            return {
                allowed: true,
                reason: 'Adulto mayor sin relaciones activas puede gestionar sus propios datos'
            };
        }
        
        // Si no es adulto mayor pero es el mismo usuario, permitir
        return {
            allowed: true,
            reason: 'Usuario gestionando sus propios datos'
        };
    }

    // Si el usuario NO es el paciente, verificar si tiene relación activa
    const { data: relationData, error: relationError } = await supabase
        .from('user_relationships')
        .select('id, permissions')
        .eq('caregiver_id', userId)
        .eq('elderly_id', patientId)
        .eq('status', 'active')
        .single();

    if (relationError || !relationData) {
        return {
            allowed: false,
            reason: 'No tienes una relación activa con este paciente'
        };
    }

    // Tiene relación activa
    return {
        allowed: true,
        reason: 'Usuario con relación activa al paciente'
    };
};

module.exports = {
    hasActiveRelationships,
    canManagePatientData
};
