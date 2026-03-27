"use strict";
const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, //Usar host que permita enviar varios correos diarios - GMAIL permite 500 diarios
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },
    });
    const mailOptions = {
        from: 'Diego Polanco <diego.polancob@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: 
    };
    await transporter.sendMail(mailOptions); //envio de email
};
module.exports = sendEmail;
