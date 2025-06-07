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

describe('POST /user', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debe registrar un usuario correctamente', async () => {
        const userData = {
            Nombre: 'Juan',
            Apellidos: 'Pérez',
            Correo: 'juan@example.com',
            Telefono: '5512345678',
            Password: 'Password123!',
            ConfirmarPassword: 'Password123!',
            PreguntaSeguridad: '¿Color favorito?',
            RespuestaSeguridad: 'Azul'
        };

        // Mock del método save de Mongoose
        Usuario.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({
                nombre: userData.Nombre,
                correo: userData.Correo,
                telefono: userData.Telefono
            })
        }));

        // Mock de axios.post para SMS
        axios.post.mockResolvedValue({ data: { status: 'sent', message: 'Código enviado' } });

        const response = await request(app)
            .post('/user')
            .field('Nombre', userData.Nombre)
            .field('Apellidos', userData.Apellidos)
            .field('Correo', userData.Correo)
            .field('Telefono', userData.Telefono)
            .field('Password', userData.Password)
            .field('ConfirmarPassword', userData.ConfirmarPassword)
            .field('PreguntaSeguridad', userData.PreguntaSeguridad)
            .field('RespuestaSeguridad', userData.RespuestaSeguridad)

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
        expect(response.body.usuario).toMatchObject({
            nombre: userData.Nombre,
            correo: userData.Correo,
            telefono: userData.Telefono
        });
        expect(response.body.sms).toBeDefined();
    });

    it('debe fallar si los correos son inválidos', async () => {
        const response = await request(app)
            .post('/user')
            .field('Nombre', 'Juan')
            .field('Apellidos', 'Pérez')
            .field('Correo', 'correo-invalido')
            .field('Telefono', '5512345678')
            .field('Password', 'Password123!')
            .field('ConfirmarPassword', 'Password123!')
            .field('PreguntaSeguridad', '¿Color favorito?')
            .field('RespuestaSeguridad', 'Azul');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('El correo electrónico no es válido');
    });

    // Puedes agregar más pruebas para:
    // - campos duplicados (simulando error.code === 11000)
    // - contraseñas no coinciden
    // - caracteres inválidos
});

const mongoose = require('mongoose');

afterAll(async () => {
    await mongoose.connection.close();
});
