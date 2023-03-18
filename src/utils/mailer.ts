let nodemailer = require("nodemailer");
const Email = require("email-templates");

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

let transport;

const host = process.env.EMAIL_host;
const port = process.env.EMAIL_port;
const username = process.env.EMAIL_username
const password = process.env.EMAIL_password;

transport = {
    host,
    port,
    secure: +port === 465 ? true : false,
    auth: {
        user: username,
        pass: password
    }
};

let transporter = nodemailer.createTransport(transport);

const email = new Email({
    transport: transporter,
    send: true,
    preview: false,
});


export const sendEmail = async function (template, to, locals, bcc?) {
    try {

        const data = await email.send({
            template,
            message: {
                from: "noreply@sociallink.one",
                to,
                bcc
            },
            locals
        })

        console.log("email has been sent!")

    } catch (error) {
        console.log('Error sending email', error)
    }
};