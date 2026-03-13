// Mock de supabase ANTES de importar el controlador
jest.mock('../config/database', () => ({
  from: jest.fn(),
}));

const supabase = require('../config/database');
const {
  getPatientMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockReqRes = (body = {}, params = {}, user = null) => {
  const req = { body, params, user };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

/**
 * Construye una cadena de supabase que es "thenable". 
 * Cuando se ejecuta `await` sobre la cadena devuelta, siempre resuelve en `result`.
 */
const buildChain = (result) => {
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: function(resolve) { resolve(result); }
  };
  return chain;
};

// ─────────────────────────────────────────────────────────────────────────────
// getPatientMedicines
// ─────────────────────────────────────────────────────────────────────────────
describe('medicineController › getPatientMedicines', () => {
  afterEach(() => jest.clearAllMocks());

  test('devuelve 200 con la lista de medicamentos', async () => {
    const medicines = [{ id: 1, name: 'Aspirina' }, { id: 2, name: 'Omeprazol' }];
    supabase.from.mockReturnValue(buildChain({ data: medicines, error: null }));

    const { req, res } = mockReqRes({}, { patientId: '42' });
    await getPatientMedicines(req, res);

    expect(res.json).toHaveBeenCalledWith(medicines);
  });

  test('devuelve [] cuando no hay medicamentos', async () => {
    supabase.from.mockReturnValue(buildChain({ data: null, error: null }));

    const { req, res } = mockReqRes({}, { patientId: '42' });
    await getPatientMedicines(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('devuelve 500 si supabase retorna error', async () => {
    supabase.from.mockReturnValue(buildChain({ data: null, error: { message: 'DB error' } }));

    const { req, res } = mockReqRes({}, { patientId: '42' });
    await getPatientMedicines(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener medicamentos' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createMedicine
// ─────────────────────────────────────────────────────────────────────────────
describe('medicineController › createMedicine', () => {
  afterEach(() => jest.clearAllMocks());

  const baseUser = { userId: 'user-1', role: 'cuidador' };
  const baseBody = {
    patientId: 'patient-1',
    name: 'Aspirina',
    dosage: '100mg',
    frequency: 'Diaria',
    time: '08:00',
    notes: 'Con comida',
    imageUrl: null,
  };

  test('403 si el usuario no tiene relación con el paciente', async () => {
    const relChain = buildChain({ data: [], error: null });
    supabase.from.mockReturnValue(relChain);

    const { req, res } = mockReqRes(baseBody, {}, baseUser);
    await createMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No tienes permiso para agregar medicamentos a este paciente' })
    );
  });

  test('500 si falla la verificación de relación', async () => {
    const relChain = buildChain({ data: null, error: { message: 'DB error' } });
    supabase.from.mockReturnValue(relChain);

    const { req, res } = mockReqRes(baseBody, {}, baseUser);
    await createMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('201 crea el medicamento correctamente', async () => {
    const newMedicine = { id: 10, name: 'Aspirina', patient_id: 'patient-1' };

    const relChain = buildChain({ data: [{ id: 'rel-1' }], error: null });
    const insertChain = buildChain({ data: newMedicine, error: null });

    supabase.from
      .mockReturnValueOnce(relChain)
      .mockReturnValueOnce(insertChain);

    const { req, res } = mockReqRes(baseBody, {}, baseUser);
    await createMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newMedicine);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateMedicine
// ─────────────────────────────────────────────────────────────────────────────
describe('medicineController › updateMedicine', () => {
  afterEach(() => jest.clearAllMocks());

  const baseUser = { userId: 'user-1' };
  const updateBody = { name: 'Paracetamol', dosage: '500mg', frequency: 'Cada 8h', time: '09:00', notes: '' };

  test('404 si el medicamento no existe', async () => {
    const notFoundChain = buildChain({ data: null, error: { message: 'not found' } });
    supabase.from.mockReturnValue(notFoundChain);

    const { req, res } = mockReqRes(updateBody, { id: '99' }, baseUser);
    await updateMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Medicamento no encontrado' });
  });

  test('403 si no tiene relación con el paciente del medicamento', async () => {
    const medChain = buildChain({ data: { patient_id: 'patient-1' }, error: null });
    const relChain = buildChain({ data: [], error: null });

    supabase.from
      .mockReturnValueOnce(medChain)
      .mockReturnValueOnce(relChain);

    const { req, res } = mockReqRes(updateBody, { id: '5' }, baseUser);
    await updateMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('200 actualiza el medicamento correctamente', async () => {
    const updatedMedicine = { id: 5, name: 'Paracetamol' };

    const medChain = buildChain({ data: { patient_id: 'patient-1' }, error: null });
    const relChain = buildChain({ data: [{ id: 'rel-1' }], error: null });
    const updateChain = buildChain({ data: updatedMedicine, error: null });

    supabase.from
      .mockReturnValueOnce(medChain)
      .mockReturnValueOnce(relChain)
      .mockReturnValueOnce(updateChain);

    const { req, res } = mockReqRes(updateBody, { id: '5' }, baseUser);
    await updateMedicine(req, res);

    expect(res.json).toHaveBeenCalledWith(updatedMedicine);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteMedicine
// ─────────────────────────────────────────────────────────────────────────────
describe('medicineController › deleteMedicine', () => {
  afterEach(() => jest.clearAllMocks());

  const baseUser = { userId: 'user-1' };

  test('404 si el medicamento no existe', async () => {
    const notFoundChain = buildChain({ data: null, error: { message: 'not found' } });
    supabase.from.mockReturnValue(notFoundChain);

    const { req, res } = mockReqRes({}, { id: '99' }, baseUser);
    await deleteMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Medicamento no encontrado' });
  });

  test('403 si no tiene relación con el paciente del medicamento', async () => {
    const medChain = buildChain({ data: { patient_id: 'patient-1' }, error: null });
    const relChain = buildChain({ data: [], error: null });

    supabase.from
      .mockReturnValueOnce(medChain)
      .mockReturnValueOnce(relChain);

    const { req, res } = mockReqRes({}, { id: '5' }, baseUser);
    await deleteMedicine(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('200 elimina el medicamento correctamente', async () => {
    const medChain = buildChain({ data: { patient_id: 'patient-1' }, error: null });
    const relChain = buildChain({ data: [{ id: 'rel-1' }], error: null });
    const deleteChain = buildChain({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(medChain)
      .mockReturnValueOnce(relChain)
      .mockReturnValueOnce(deleteChain);

    const { req, res } = mockReqRes({}, { id: '5' }, baseUser);
    await deleteMedicine(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Medicamento eliminado correctamente' });
  });
});
