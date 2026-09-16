// Configuración de las credenciales de EmailJS
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_f75fbir',
  TEMPLATE_ID: 'ew391bg',
  PUBLIC_KEY: 'D3fmwok6fbm58WR_p',
};

/**
 * Función para enviar la contraseña temporal vía EmailJS
 * @param {string} toEmail - Correo del destinatario
 * @param {string} tempPassword - Clave provisoria generada
 */
export const sendForgotPasswordEmail = async (toEmail, tempPassword) => {
  const payload = {
    service_id: EMAILJS_CONFIG.SERVICE_ID,
    template_id: EMAILJS_CONFIG.TEMPLATE_ID,
    user_id: EMAILJS_CONFIG.PUBLIC_KEY,
    template_params: {
      to_email: toEmail,
      temp_password: tempPassword,
    },
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`EmailJS Error status ${response.status}: ${errorData}`);
  }

  return true;
};