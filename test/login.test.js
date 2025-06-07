const request = require('supertest');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const router = require('../routes/funciones.routes'); // ajusta la ruta según tu proyecto

process.removeAllListeners('warning');
process.on('warning', (e) => {
    if (!e.name.includes('DeprecationWarning')) console.warn(e);
});

jest.mock('axios');
jest.mock('../routes/Models/usuarios'); // ajusta a tu ruta

const axios = require('axios');
const Usuario = require('../routes/Models/usuarios'); // ajusta

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);


describe('POST /api/login', () => {
    it('debe iniciar sesión correctamente', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                Correo: 'test@example.com',
                Password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.usuario).toBeDefined();
        expect(res.body.usuario.correo).toBe('test@example.com');
    });

    it('debe fallar si el correo no es válido', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ Correo: 'no-es-correo', Password: 'pass' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Correo inválido");
    });

    it('debe fallar si el usuario no existe', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ Correo: 'desconocido@example.com', Password: '123' });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Usuario no encontrado");
    });

    it('debe fallar si la contraseña es incorrecta', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ Correo: 'test@example.com', Password: 'malaClave' });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Contraseña incorrecta");
    });

    it('debe fallar si no está confirmada la cuenta', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ Correo: 'sinconfirmar@example.com', Password: 'password123' });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Cuenta no confirmada");
    });
});

const mongoose = require('mongoose');

afterAll(async () => {
    await mongoose.connection.close();
});
