export const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
  TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
  PUBLIC_KEY: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
};

export const sendForgotPasswordEmail = async (toEmail, tempPassword) => {
  const cleanEmail = toEmail.trim();

  const payload = {
    service_id: EMAILJS_CONFIG.SERVICE_ID,
    template_id: EMAILJS_CONFIG.TEMPLATE_ID,
    user_id: EMAILJS_CONFIG.PUBLIC_KEY,
    template_params: {
      to_email: cleanEmail,
      email: cleanEmail,
      temp_password: tempPassword,
    },
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.log('EmailJS respondió:', response.status, errorData);
    throw new Error(`EmailJS Error status ${response.status}: ${errorData}`);
  }

  return true;
};