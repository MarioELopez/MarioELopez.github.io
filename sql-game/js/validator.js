// =============================================================
// validator.js — Validador de Condiciones de Éxito
// Evalúa si la consulta ejecutada cumple con el objetivo
// de la misión actual. Nunca valida el SQL exacto, sino
// el resultado o el tipo de operación realizada.
// =============================================================

const Validator = (() => {

  // Resultado de validación
  function result(success, code = null) {
    return { success, code };
  }

  // Valida una consulta ejecutada contra la misión activa
  // queryType  : string — tipo detectado por el analyzer
  // rawSQL     : string — SQL original del usuario
  // execResult : { columns, rows, rowsAffected, error } | null
  // mission    : objeto de missions.js
  function validate(mission, queryType, rawSQL, execResult) {

    // Si hubo error de ejecución, la misión no se supera
    if (execResult && execResult.error) {
      return result(false, 'EXEC_ERROR');
    }

    // Verificar trampa PRIMERO (antes de verificar éxito)
    if (mission.trapPossible && mission.trapCondition) {
      const isTrapped = mission.trapCondition.check(rawSQL);
      if (isTrapped) {
        return result(false, 'TRAP_TRIGGERED');
      }
    }

    // Verificar condición de éxito
    try {
      const passed = mission.successCondition.check(
        queryType,
        rawSQL,
        execResult
      );
      if (passed) return result(true, 'SUCCESS');
    } catch (e) {
      console.warn('Validator error:', e);
    }

    return result(false, 'NOT_YET');
  }

  // Códigos de resultado y su significado
  const CODES = {
    SUCCESS:       'Misión completada.',
    TRAP_TRIGGERED:'Trampa activada — operación peligrosa sin control.',
    EXEC_ERROR:    'La consulta falló con un error de ejecución.',
    NOT_YET:       'La consulta no cumplió el objetivo de la misión.',
  };

  return { validate, CODES };

})();
