const request = require('supertest');
const app = express();
const Usuario = require('../models/Usuario');

jest.mock('../models/Usuario');

describe('POST /confirmation', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe devolver error si el código es inválido', async () => {
        Usuario.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post('/confirmation')
            .send({ code: 'invalid-code' });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Código inválido');
    });

    it('debe confirmar la cuenta si el código es válido', async () => {
        Usuario.findOne.mockResolvedValue({ _id: '123', correo: 'test@example.com' });
        Usuario.updateOne.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

        const response = await request(app)
            .post('/confirmation')
            .send({ code: 'valid-code' });

        // En este caso, se espera que el render sea un HTML, así que chequeamos contenido
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('El usuario ha sido creado satisfactoriamente');
    });

    it('debe manejar errores del servidor', async () => {
        Usuario.findOne.mockRejectedValue(new Error('DB error'));

        const response = await request(app)
            .post('/confirmation')
            .send({ code: 'any-code' });

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error del servidor');
    });
});
