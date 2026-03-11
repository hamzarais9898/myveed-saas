const nodemailer = require('nodemailer');

// Configure primary transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'contact@maveed.io',
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configure secondary/failover transporter
const secondaryTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER_SECONDARY || 'othman.mekouar99@gmail.com',
    pass: process.env.EMAIL_PASSWORD_SECONDARY
  }
});

/**
 * Helper to send mail with failover mechanism
 */
const sendMailWithFailover = async (mailOptions) => {
  try {
    // Attempt with primary transporter
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent via primary transporter: %s', info.messageId);
    return info;
  } catch (primaryError) {
    console.warn('Primary email transporter failed, attempting secondary:', primaryError.message);
    
    try {
      // Update the "from" address for secondary transporter if it's strictly linked to the auth user
      const secondaryMailOptions = { 
        ...mailOptions, 
        from: mailOptions.from.replace(process.env.EMAIL_USER, process.env.EMAIL_USER_SECONDARY)
      };
      
      const info = await secondaryTransporter.sendMail(secondaryMailOptions);
      console.log('Email sent via secondary transporter: %s', info.messageId);
      return info;
    } catch (secondaryError) {
      console.error('All email transporters failed:', secondaryError.message);
      throw secondaryError;
    }
  }
};

/**
 * Send a contact form email notification
 */
const sendContactEmail = async (data) => {
  // ... existing logic remains similar but using updated transporter
  try {
    const { name, email, subject, message } = data;

    const mailOptions = {
      from: `"MAVEED Support" <${process.env.EMAIL_USER}>`,
      to: 'contact@maveed.io',
      replyTo: email,
      subject: `[Support Request] ${subject}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background-color: #f4f7f6;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <h2 style="color: #c77ddf; margin-bottom: 24px; font-weight: 800;">Message Support</h2>
            <p style="font-size: 16px; line-height: 1.6;"><strong>De:</strong> ${name || 'Utilisateur'} (${email})</p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>Sujet:</strong> ${subject}</p>
            <div style="background-color: #f9fafb; padding: 25px; border-radius: 16px; border: 1px solid #edf2f7; margin-top: 24px;">
              <p style="white-space: pre-wrap; margin: 0; font-size: 15px; color: #4a5568;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #a0aec0; margin-top: 40px; border-top: 1px solid #edf2f7; pt: 20px;">
              Cet email a été envoyé via le formulaire de contact MAVEED.
            </p>
          </div>
        </div>
      `
    };

    const info = await sendMailWithFailover(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending contact email after failover attempt:', error);
    return false;
  }
};

/**
 * Send a confirmation email to the client after they submit a contact form
 */
const sendContactConfirmationToClient = async (email, name) => {
  try {
    const mailOptions = {
      from: `"MAVEED Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Nous avons bien reçu votre message ! 📬",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; padding: 48px; border: 1px solid #f1f5f9; box-shadow: 0 20px 50px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 32px; text-align: center;">
                <span style="font-size: 32px; font-weight: 900; background: linear-gradient(to right, #e2a9f1, #c77ddf); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MAVEED</span>
            </div>
            <h2 style="color: #1a1a1a; margin-bottom: 24px; font-weight: 900; font-size: 26px; text-align: center;">Message reçu ! 🚀</h2>
            <p style="font-size: 16px; line-height: 1.8; color: #475569; text-align: center; margin-bottom: 32px;">
              Bonjour ${name || ''},<br><br>
              Votre message a été envoyé avec succès ! Notre équipe a bien reçu votre demande et nous vous répondrons dans un délai de <strong>24h maximum</strong>.
            </p>
            <div style="background: #f1f5f9; padding: 24px; border-radius: 20px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Merci de votre patience et de votre confiance.
              </p>
            </div>
            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              © 2026 MAVEED - AI Video Automation
            </div>
          </div>
        </div>
      `
    };

    await sendMailWithFailover(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
    return false;
  }
};

/**
 * Send a verification email with a 6-digit code
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit verification code
 */
const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: `"MAVEED" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[MAVEED] Code de vérification : ${code}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background-color: #f4f7f6;">
          <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; text-align: center; border: 1px solid #edf2f7;">
            <div style="margin-bottom: 30px;">
                <span style="font-size: 28px; font-weight: 900; background: linear-gradient(to right, #e2a9f1, #c77ddf); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MAVEED</span>
            </div>
            <h2 style="color: #2d3748; margin-bottom: 16px; font-weight: 800; font-size: 24px;">Vérifiez votre email</h2>
            <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              Merci de rejoindre MAVEED ! Utilisez le code ci-dessous pour activer votre compte. Ce code est valide pour les <strong>5 prochaines minutes</strong>.
            </p>
            <div style="background: #f7fafc; padding: 30px; border-radius: 20px; border: 2px dashed #e2e8f0; margin-bottom: 32px;">
              <span style="font-family: monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1a202c; margin-left: 12px;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #a0aec0;">
              Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.
            </p>
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #edf2f7; font-size: 12px; color: #cbd5e0;">
              © 2026 MAVEED - AI Video Automation
            </div>
          </div>
        </div>
      `
    };

    const info = await sendMailWithFailover(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email after failover attempt:', error);
    return false;
  }
};

/**
 * Send a welcome email to a new newsletter subscriber
 */
const sendNewsletterWelcomeEmail = async (email) => {
  try {
    const mailOptions = {
      from: `"MAVEED Newsletter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Félicitations et Bienvenue chez MAVEED ! 🎬",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; padding: 48px; border: 1px solid #f1f5f9; box-shadow: 0 20px 50px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 32px; text-align: center;">
                <span style="font-size: 32px; font-weight: 900; background: linear-gradient(to right, #e2a9f1, #c77ddf); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MAVEED</span>
            </div>
            <h2 style="color: #1a1a1a; margin-bottom: 24px; font-weight: 900; font-size: 28px; text-align: center; tracking: -0.02em;">Bienvenue dans l'aventure ! 🚀</h2>
            <p style="font-size: 16px; line-height: 1.8; color: #475569; text-align: center; margin-bottom: 32px;">
              Félicitations ! Vous faites désormais partie de la communauté <strong>MAVEED</strong>. Vous recevrez en exclusivité nos dernières innovations en IA vidéo, des conseils pour booster votre contenu et des offres spéciales.
            </p>
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 32px; border-radius: 24px; text-align: center; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 15px; color: #64748b; font-weight: 600;">
                "L'intelligence artificielle au service de votre imagination."
              </p>
            </div>
            <div style="margin-top: 40px; text-align: center;">
                <a href="https://maveed.com/dashboard" style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; letter-spacing: 1px; transition: transform 0.2s;">DÉCOUVRIR LE STUDIO</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 32px; text-align: center;">
              Vous recevez cet email car vous vous êtes inscrit à la newsletter sur MAVEED.<br>
              <a href="#" style="color: #c77ddf; text-decoration: none;">Se désinscrire</a>
            </p>
          </div>
        </div>
      `
    };

    const info = await sendMailWithFailover(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email after failover attempt:', error);
    return false;
  }
};

/**
 * Send bulk newsletter email
 */
const sendBulkNewsletterEmail = async (emails, subject, content) => {
  try {
    const mailOptions = {
      from: `"MAVEED News" <${process.env.EMAIL_USER}>`,
      bcc: emails, // Use BCC for bulk email
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; padding: 48px; border: 1px solid #f1f5f9; box-shadow: 0 20px 50px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 32px;">
                <span style="font-size: 24px; font-weight: 900; background: linear-gradient(to right, #e2a9f1, #c77ddf); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MAVEED</span>
            </div>
            <div style="font-size: 16px; line-height: 1.8; color: #334155;">
              ${content}
            </div>
            <div style="margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 32px; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © 2026 MAVEED - Intelligence Artificielle Vidéo<br>
                <a href="#" style="color: #c77ddf; text-decoration: none;">Gérer mes préférences</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await sendMailWithFailover(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending bulk newsletter email after failover attempt:', error);
    return false;
  }
};

module.exports = {
  sendContactEmail,
  sendVerificationEmail,
  sendNewsletterWelcomeEmail,
  sendBulkNewsletterEmail,
  sendContactConfirmationToClient
};
