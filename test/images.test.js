const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const router = require('../routes/funciones.routes'); // ajusta la ruta según tu proyecto

const app = express();

process.removeAllListeners('warning');
process.on('warning', (e) => {
    if (!e.name.includes('DeprecationWarning')) console.warn(e);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

beforeAll(async () => {
    // Conexión a MongoDB (ajusta si usas .env)
    await mongoose.connect('mongodb://localhost:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('GET /database/imagenes', () => {
    it('debe devolver un arreglo de imágenes con status 200', async () => {
        const res = await request(app).get('/database/imagenes');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    }, 10000); // Aumenta el timeout si la consulta tarda
});
