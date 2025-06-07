const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app.js');
const { Usuario } = require('../routes/Models/usuarios.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

jest.mock('axios');


let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Usuario.deleteMany();
  jest.clearAllMocks();
});

test('debería registrar un usuario con imagen por defecto', async () => {
  // ⚠️ Mock para evitar render real
  app.response.render = jest.fn(function (view, data) {
    this.send({ view, ...data }); // Para poder testearlo con supertest
  });

  axios.post.mockResolvedValue({ data: 'OK' }); // Mock del SMS

  const response = await request(app)
    .post('/database/registro')
    .field('Nombre', 'Juan')
    .field('Apellidos', 'Pérez')
    .field('Correo', 'juan@example.com')
    .field('Telefono', '1234567890')
    .field('Password', 'Password123!')
    .field('ConfirmarPassword', 'Password123!')
    .field('PreguntaSeguridad', 'Color favorito')
    .field('RespuestaSeguridad', 'Azul');

  expect(response.statusCode).toBe(200);
  expect(response.body.view).toBe('formularios/login');
  expect(response.body.mensaje).toMatch(/usuario ha sido creado/i);

  const usuarios = await Usuario.find({});
  expect(usuarios.length).toBe(1);
  expect(axios.post).toHaveBeenCalled(); // Se envió SMS
});