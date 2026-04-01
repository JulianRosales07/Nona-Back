const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Inicializar Resend si hay API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Configurar el transportador de email (fallback a nodemailer)
const createTransporter = () => {
    // Verificar si hay credenciales de email configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️ Credenciales de email no configuradas. Los emails no se enviarán.');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

const sendPasswordResetEmail = async (email, code, userName = 'Usuario') => {
    // Prioridad 1: Usar Resend si está configurado
    if (resend) {
        try {
            await resend.emails.send({
                from: 'Nona App <onboarding@resend.dev>', // En producción usa tu dominio verificado
                to: email,
                subject: 'Código de recuperación de contraseña - Nona App',
                html: getEmailTemplate(code, userName)
            });
            console.log(`✅ Email enviado exitosamente a ${email} via Resend`);
            return { success: true, mode: 'production' };
        } catch (error) {
            console.error('❌ Error al enviar email con Resend:', error);
            // Continuar al fallback
        }
    }

    // Prioridad 2: Usar Gmail con nodemailer
    const transporter = createTransporter();

    if (!transporter) {
        console.log(`📧 Código de recuperación para ${email}: ${code}`);
        return { success: true, mode: 'development', code };
    }

    const mailOptions = {
        from: `"Nona App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Código de recuperación de contraseña - Nona App',
        html: getEmailTemplate(code, userName)
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado exitosamente a ${email} via Gmail`);
        return { success: true, mode: 'production' };
    } catch (error) {
        console.error('❌ Error al enviar email con Gmail:', error);
        // En caso de error, al menos loguear el código y retornarlo
        console.log(`📧 Código de recuperación para ${email}: ${code}`);
        // Retornar el código en modo desarrollo para que la app lo muestre
        return { success: true, mode: 'development', code };
    }
};

const getEmailTemplate = (code, userName) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #162839;
                    margin-bottom: 10px;
                }
                .title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #162839;
                    margin-bottom: 20px;
                }
                .code-container {
                    background: linear-gradient(135deg, #E8F4F5 0%, #D4EEF0 100%);
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    margin: 30px 0;
                }
                .code {
                    font-size: 48px;
                    font-weight: bold;
                    color: #162839;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }
                .message {
                    font-size: 16px;
                    color: #546162;
                    margin-bottom: 20px;
                    line-height: 1.8;
                }
                .warning {
                    background-color: #FFF3CD;
                    border-left: 4px solid #F59E0B;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .warning-text {
                    color: #856404;
                    font-size: 14px;
                    margin: 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #E0E0E0;
                    font-size: 14px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🏥 Nona</div>
                    <div class="title">Recuperación de contraseña</div>
                </div>
                
                <p class="message">
                    Hola <strong>${userName}</strong>,
                </p>
                
                <p class="message">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                    Usa el siguiente código de verificación:
                </p>
                
                <div class="code-container">
                    <div class="code">${code}</div>
                </div>
                
                <div class="warning">
                    <p class="warning-text">
                        ⏰ Este código expirará en <strong>15 minutos</strong>.
                    </p>
                </div>
                
                <p class="message">
                    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
                </p>
                
                <div class="footer">
                    <p>Este es un correo automático, por favor no respondas.</p>
                    <p>© ${new Date().getFullYear()} Nona App - Cuidado para adultos mayores</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    sendPasswordResetEmail
};
