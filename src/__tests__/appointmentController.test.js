// Mock de supabase ANTES de importar el controlador
jest.mock('../config/database', () => ({
  from: jest.fn(),
}));

const supabase = require('../config/database');
const {
  createAppointment,
  getPatientAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockReqRes = (body = {}, params = {}, user = null) => {
  const req = { body, params, user };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

// ─────────────────────────────────────────────────────────────────────────────
// createAppointment
// ─────────────────────────────────────────────────────────────────────────────
describe('appointmentController › createAppointment', () => {
  afterEach(() => jest.clearAllMocks());

  const baseUser = { userId: 'user-1' };
  const validBody = {
    patient_id: 'patient-1',
    doctor_name: 'Dr. Pérez',
    specialty: 'Cardiología',
    appointment_date: '2025-05-01',
    appointment_time: '10:00',
    location: 'Clínica Norte',
    notes: '',
  };

  test('400 si faltan campos obligatorios', async () => {
    const { req, res } = mockReqRes(
      { patient_id: 'patient-1', doctor_name: 'Dr. Pérez' }, // faltan specialty, date, time, location
      {},
      baseUser
    );
    await createAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Todos los campos obligatorios deben ser proporcionados' })
    );
  });

  test('403 si el usuario no está vinculado al paciente', async () => {
    // El usuario NO es el mismo que patient_id y la relación está vacía
    const relChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      // La cadena termina con el último .eq(); lo simulamos aquí
    };
    // Supabase devuelve error de relación
    const finalChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    // Usamos mockImplementation para que el eq encadenado termine resolviendo
    let eqCallCount = 0;
    const mockEq = jest.fn().mockImplementation(function () {
      eqCallCount++;
      if (eqCallCount >= 3) {
        return Promise.resolve({ data: [], error: null });
      }
      return this;
    });
    const chain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
    };
    supabase.from.mockReturnValue(chain);

    const { req, res } = mockReqRes(validBody, {}, baseUser);
    await createAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('201 crea la cita si el usuario es el mismo paciente', async () => {
    const newAppointment = { id: 1, ...validBody };
    const insertChain = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [newAppointment], error: null }),
    };
    supabase.from.mockReturnValue(insertChain);

    // El userId coincide con patient_id → salta verificación de relación
    const { req, res } = mockReqRes(
      { ...validBody, patient_id: 'user-1' },
      {},
      { userId: 'user-1' }
    );
    await createAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPatientAppointments
// ─────────────────────────────────────────────────────────────────────────────
describe('appointmentController › getPatientAppointments', () => {
  afterEach(() => jest.clearAllMocks());

  test('200 devuelve las citas cuando el userId es el mismo paciente', async () => {
    const appointments = [
      { id: 1, doctor_name: 'Dr. López', created_by_user: { name: 'Ana', role: 'cuidador' } },
    ];
    const apptChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };
    // El último .order() resuelve
    let orderCount = 0;
    apptChain.order.mockImplementation(function () {
      orderCount++;
      if (orderCount >= 2) return Promise.resolve({ data: appointments, error: null });
      return this;
    });

    supabase.from.mockReturnValue(apptChain);

    const { req, res } = mockReqRes({}, { patientId: '42' }, { userId: 42 }); // mismo id
    await getPatientAppointments(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, appointments: expect.any(Array) })
    );
  });

  test('403 si el usuario no es el paciente y no tiene relación', async () => {
    let eqCallCount = 0;
    const mockEq = jest.fn().mockImplementation(function () {
      eqCallCount++;
      if (eqCallCount >= 3) return Promise.resolve({ data: [], error: null });
      return this;
    });
    const chain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
    };
    supabase.from.mockReturnValue(chain);

    const { req, res } = mockReqRes({}, { patientId: '999' }, { userId: 'other-user' });
    await getPatientAppointments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAppointmentById
// ─────────────────────────────────────────────────────────────────────────────
describe('appointmentController › getAppointmentById', () => {
  afterEach(() => jest.clearAllMocks());

  test('404 si la cita no existe', async () => {
    const notFoundChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };
    supabase.from.mockReturnValue(notFoundChain);

    const { req, res } = mockReqRes({}, { id: '999' }, { userId: 'user-1' });
    await getAppointmentById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cita no encontrada' })
    );
  });

  test('200 devuelve la cita si el usuario es el paciente', async () => {
    const apt = { id: 1, patient_id: 'user-1', created_by_user: { name: 'Ana', role: 'cuidador' } };
    const foundChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: apt, error: null }),
    };
    supabase.from.mockReturnValue(foundChain);

    const { req, res } = mockReqRes({}, { id: '1' }, { userId: 'user-1' });
    await getAppointmentById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, appointment: expect.objectContaining({ id: 1 }) })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateAppointmentStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('appointmentController › updateAppointmentStatus', () => {
  afterEach(() => jest.clearAllMocks());

  test('400 si el estado es inválido', async () => {
    const { req, res } = mockReqRes({ status: 'invalido' }, { id: '1' }, { userId: 'user-1' });
    await updateAppointmentStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Estado inválido' })
    );
  });

  test.each(['pending', 'confirmed', 'cancelled', 'completed'])(
    '200 actualiza correctamente al estado "%s"',
    async (status) => {
      const updatedApt = { id: 1, status };
      const updateChain = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedApt, error: null }),
      };
      supabase.from.mockReturnValue(updateChain);

      const { req, res } = mockReqRes({ status }, { id: '1' }, { userId: 'user-1' });
      await updateAppointmentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, appointment: expect.objectContaining({ status }) })
      );
    }
  );

  test('404 si la cita no existe al actualizar estado', async () => {
    const notFoundChain = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    };
    supabase.from.mockReturnValue(notFoundChain);

    const { req, res } = mockReqRes({ status: 'confirmed' }, { id: '999' }, { userId: 'user-1' });
    await updateAppointmentStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteAppointment
// ─────────────────────────────────────────────────────────────────────────────
describe('appointmentController › deleteAppointment', () => {
  afterEach(() => jest.clearAllMocks());

  const baseUser = { userId: 'user-1' };

  test('404 si la cita no existe', async () => {
    const notFoundChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    };
    supabase.from.mockReturnValue(notFoundChain);

    const { req, res } = mockReqRes({}, { id: '999' }, baseUser);
    await deleteAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('200 elimina la cita si el usuario es el creador', async () => {
    // 1ª: obtener cita → creador es user-1
    const fetchChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { patient_id: 'patient-1', created_by: 'user-1' },
        error: null,
      }),
    };
    // 2ª: delete → éxito
    const deleteChain = {
      from: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    supabase.from
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(deleteChain);

    const { req, res } = mockReqRes({}, { id: '5' }, baseUser);
    await deleteAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Cita eliminada exitosamente' })
    );
  });
});
