const nodemailer = require('nodemailer');

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        //servicio que envia el email
        host: process.env.EMAIL_HOST, //Usar host que permita enviar varios correos diarios - GMAIL permite 500 diarios
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        //Definicion de email
        from: process.env.EMAIL_FROM || 'noreply@polanco.dev',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html:
    };

    await transporter.sendMail(mailOptions); //envio de email
};
export = sendEmail;
