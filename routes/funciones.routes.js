const express = require('express');
const router = express.Router();
const Usuario = require('./Models/usuarios');
const Imagen = require('./Models/imagenes');
const multer = require('multer');
const fs = require('fs');
const path = require("path");
const crypto = require('crypto');
const axios = require('axios');


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const url = 'https://rest.clicksend.com/v3/sms/send';
const username = 'eduelcrack33@gmaial.com';
const password = '874F1AB5-6774-2CAC-1C7C-AC842085EEAB';


router.post('/confirmation', async (req, res) => {
    const { code } = req.body;

    try {
        const user = await Usuario.findOne({ code });

        if (!user) {
            return res.status(400).json({ success: false, message: "Código inválido" });
        }

        await Usuario.updateOne({ code }, { $set: { code_confirmed: true } });

        // Para pruebas, puedes verificar que el mensaje esté en el HTML renderizado
        return res.render("formularios/login", { mensaje: "El usuario ha sido creado satisfactoriamente" });

    } catch (error) {
        console.error("Error during confirmation process:", error);
        return res.status(500).json({ success: false, message: "Error del servidor" });
    }
});



// router.post('/confirmation', async (req, res) => {
//     let { code } = req.body;

//     console.log(code);

//     try {
//         let user = await Usuario.findOne({ code: code });

//         if (!user) {
//             return res.send('<script>alert("Código inválido"); window.location.href = "/confirmation";</script>');
//         }


//         await Usuario.updateOne({ code: code }, { $set: { code_confirmed: true } });

//         return res.render("formularios/login", { mensaje: "El usuario ha sido creado satisfactoriamente" });
//     } catch (error) {
//         console.error("Error during confirmation process:", error);
//         return res.status(500).send('<script>alert("Ocurrió un error. Por favor, inténtalo de nuevo."); window.location.href = "/confirmation";</script>');
//     }
// });


router.post('/user', upload.single('Foto'), async (req, res) => {
    try {
        const {
            Nombre, Apellidos, Correo, Telefono,
            Password, ConfirmarPassword,
            PreguntaSeguridad, RespuestaSeguridad
        } = req.body;
        let Foto;

        if (req.file) {
            Foto = req.file.buffer.toString('base64');
        } else {
            const defaultImagePath = path.join(__dirname, '..', 'public', 'assets', 'user_Default.png');
            const defaultImageBuffer = fs.readFileSync(defaultImagePath);
            Foto = defaultImageBuffer.toString('base64');
        }

        let regexPass = /^[a-zA-Z0-9!#$%&\/?\\¿¡+*~{[^`},;.:_-]*$/;
        let regexUser = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        let regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!regexUser.test(Nombre) || !regexUser.test(Apellidos)) {
            return res.status(400).json({ error: "Nombre o Apellidos contienen caracteres no permitidos" });
        }

        if (!regexCorreo.test(Correo)) {
            return res.status(400).json({ error: "El correo electrónico no es válido" });
        }

        if (Password !== ConfirmarPassword) {
            return res.status(400).json({ error: "Las contraseñas no coinciden" });
        }

        if (!regexPass.test(Password)) {
            return res.status(400).json({ error: "La contraseña contiene caracteres no permitidos" });
        }

        let hash = crypto.createHash('sha1');
        let data = hash.update(Password, 'utf-8');
        let gen_hash = data.digest('hex');

        let confirmationCode = Math.floor(10000 + Math.random() * 90000);

        const usuario = new Usuario({
            nombre: Nombre,
            apellidos: Apellidos,
            correo: Correo,
            telefono: Telefono,
            password: gen_hash,
            foto: Foto,
            code: confirmationCode,
            code_confirmed: false,
            preguntaSeguridad: PreguntaSeguridad,
            respuestaSeguridad: RespuestaSeguridad
        });

        const NuevoUsuario = await usuario.save();

        const sms = {
            messages: [
                {
                    body: `Tu codigo de confirmacion es: ${confirmationCode}`,
                    to: `+52${Telefono}`,
                    from: "{{from}}"
                }
            ]
        };

        try {
            const response = await axios.post(url, sms, {
                auth: {
                    username: username,
                    password: password
                }
            });

            console.log('Respuesta SMS:', response.data);
            return res.status(201).json({
                message: "Usuario registrado exitosamente",
                usuario: {
                    nombre: NuevoUsuario.nombre,
                    correo: NuevoUsuario.correo,
                    telefono: NuevoUsuario.telefono
                },
                sms: response.data
            });
        } catch (error) {
            console.error('Error enviando SMS:', error);
            return res.status(500).json({ error: "Usuario registrado, pero ocurrió un error al enviar el SMS" });
        }

    } catch (error) {
        if (error.code === 11000) {
            const campoDuplicado = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ error: `El campo ${campoDuplicado} ya está registrado` });
        } else {
            console.error("Error en el servidor:", error);
            return res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
        }
    }
});



router.post('/database/registro', upload.single('Foto'), async (req, res) => {
    try {
        const { Nombre, Apellidos, Correo, Telefono, Password, ConfirmarPassword, PreguntaSeguridad, RespuestaSeguridad } = req.body;
        let Foto;

        console.log(PreguntaSeguridad, RespuestaSeguridad);

        if (req.file) {
            Foto = req.file.buffer.toString('base64');
        } else {
            const defaultImagePath = path.join(__dirname, '..', 'public', 'assets', 'user_Default.png');
            const defaultImageBuffer = fs.readFileSync(defaultImagePath);
            Foto = defaultImageBuffer.toString('base64');
        }

        let regexPass = /^[a-zA-Z0-9!#$%&\/?\\¿¡+*~{[^`},;.:_-]*$/;
        let regexUser = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        let regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!regexUser.test(Nombre) || !regexUser.test(Apellidos)) {
            return res.render("formularios/registro", { mensaje: "Nombre o Apellidos contienen caracteres no permitidos" });
        }

        if (!regexCorreo.test(Correo)) {
            return res.render("formularios/registro", { mensaje: "El correo electrónico no es válido" });
        }

        if (Password !== ConfirmarPassword) {
            return res.render("formularios/registro", { mensaje: "Las contraseñas no coinciden" });
        }

        if (!regexPass.test(Password)) {
            return res.render("formularios/registro", { mensaje: "La contraseña contiene caracteres no permitidos" });
        }

        let hash = crypto.createHash('sha1');
        let data = hash.update(Password, 'utf-8');
        let gen_hash = data.digest('hex');

        let confirmationCode = Math.floor(10000 + Math.random() * 90000);

        const usuario = new Usuario({
            nombre: Nombre,
            apellidos: Apellidos,
            correo: Correo,
            telefono: Telefono,
            password: gen_hash,
            foto: Foto,
            code: confirmationCode,
            code_confirmed: false,
            preguntaSeguridad: PreguntaSeguridad,
            respuestaSeguridad: RespuestaSeguridad
        });

        const NuevoUsuario = await usuario.save();

        const sms = {
            messages: [
                {
                    body: `Tu codigo de confirmacion es: ${confirmationCode}`,
                    to: `+52${Telefono}`,
                    from: "{{from}}"
                }
            ]
        };

        try {
            const response = await axios.post(url, sms, {
                auth: {
                    username: username,
                    password: password
                }
            });
            console.log('Respuesta:', response.data);
            return res.render('confirmation');
        } catch (error) {
            console.error('Error enviando SMS:', error);
            return res.send('<script>alert("Algo ha fallado al enviar el SMS"); window.location.href = "/login";</script>');
        }

    } catch (error) {
        if (error.code === 11000) {
            const campoDuplicado = Object.keys(error.keyPattern)[0];
            return res.render("formularios/registro", { mensaje: `El campo ${campoDuplicado} ya está registrado` });
        } else {
            console.error("Error en el servidor:", error);
            return res.render("error", { message: error.message });
        }
    }
});


router.post('/api/login', async (req, res) => {
    try {
        const { Correo, Password } = req.body;
        const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!regexCorreo.test(Correo)) {
            return res.status(400).json({ success: false, message: "Correo inválido" });
        }

        const usuario = await Usuario.findOne({ correo: Correo });
        if (!usuario) {
            return res.status(403).json({ success: false, message: "Cuenta no confirmada" });
        }

        if (!usuario.code_confirmed) {
            return res.status(403).json({ success: false, message: "Cuenta no confirmada" });
        }

        const hash = crypto.createHash('sha1').update(Password, 'utf-8').digest('hex');
        if (hash !== usuario.password) {
            return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
        }

        return res.status(200).json({ success: true, usuario: { correo: usuario.correo, nombre: usuario.nombre } });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});


router.post('/database/login', async (req, res) => {
    try {
        const { Correo, Password } = req.body;
        let regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!regexCorreo.test(Correo)) {
            return res.render("formularios/login", { mensaje: "El correo electrónico no es válido" });
        }
        const usuario = await Usuario.findOne({ correo: Correo });
        if (!usuario) {
            return res.render("formularios/login", { mensaje: "Correo electrónico no encontrado" });
        }
        let hash = crypto.createHash('sha1');
        let data = hash.update(Password, 'utf-8');
        let gen_hash = data.digest('hex');
        if (gen_hash !== usuario.password) {
            return res.render("formularios/login", { mensaje: "Contraseña incorrecta" });
        }
        

        if(!usuario.code_confirmed) {
            return res.render('confirmation')
        } else {

            req.session.usuario = usuario;
            req.session.save()

                 return res.redirect('/')
        }

        
    } catch (error) {
        return res.render("error", { message: error.message });
    }
});


router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});


router.get('/database/imagenes', async (req, res) => {
    try {
        const imagenes = await Imagen.find();
        res.status(200).json(imagenes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/database/imagenes/:correo', async (req, res) => {
    const correo = req.params.correo;
    try {
        const imagenes = await Imagen.find({ correo });
        res.status(200).json(imagenes);
    } catch (error) {
        return res.render("error", { message: error.message });
    }
});

//Agregar una nueva imagen
router.post('/upload', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se subió ninguna imagen');
        }
        // Convertir la imagen a base64
        const base64Image = req.file.buffer.toString('base64');
        // Guardar la imagen en la base de datos o hacer lo que sea necesario
        // Aquí se guarda en la base de datos de ejemplo
 
      

        const nuevaImagen = new Imagen({
            nombreImagen: req.file.originalname,
            imagen: base64Image,
            correo: req.session.usuario.correo,
            nombre: req.session.usuario.nombre,
            apellidos: req.session.usuario.apellidos,
        });

        await nuevaImagen.save();
        // Responder con éxito
        res.status(201).send('Imagen subida correctamente');
    } catch (error) {
        console.error('Error al subir la imagen:', error);
        res.status(500).send('Error al subir la imagen');
    }
});

module.exports = router;
