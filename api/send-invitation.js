import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, invitationLink, wishlistTitle, inviterName } = req.body;

    if (!email || !invitationLink || !wishlistTitle) {
      return res.status(400).json({
        error: 'Missing required fields: email, invitationLink, wishlistTitle',
      });
    }

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Wishly App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🎁 You've been invited to help with ${wishlistTitle}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Wishlist Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="font-size: 24px; color: white;">🎁</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Wishly</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Gift coordination made easy</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">You've been invited! 🎉</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${
                inviterName ? `<strong>${inviterName}</strong>` : 'Someone'
              } has invited you to help coordinate gifts for:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #667eea; margin: 0; font-size: 22px;">${wishlistTitle}</h3>
            </div>
            
            <p style="margin: 25px 0;">
              As an admin, you'll be able to:
            </p>
            
            <ul style="color: #555; margin: 20px 0; padding-left: 20px;">
              <li style="margin: 8px 0;">✅ See which items have been claimed by others</li>
              <li style="margin: 8px 0;">🎯 Help coordinate gift-giving to avoid duplicates</li>
              <li style="margin: 8px 0;">👥 Share the wishlist with other family and friends</li>
              <li style="margin: 8px 0;">📋 Get an overview of all gift planning</li>
            </ul>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${invitationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⏰ This invitation expires in 7 days.</strong><br>
                Click the button above to accept and get started!
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions about Wishly or this invitation, feel free to reach out to the person who invited you.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This email was sent by Wishly. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Invitation email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send invitation email',
      details: error.message,
    });
  }
}
