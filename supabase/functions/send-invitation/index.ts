import nodemailer from 'npm:nodemailer@6.9.10';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Gmail SMTP configuration
const GMAIL_USER = Deno.env.get('GMAIL_USER'); // wishly.the.wishlist.app@gmail.com
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD'); // Gmail app password

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(
      'Function called, Gmail credentials available:',
      !!GMAIL_USER && !!GMAIL_APP_PASSWORD
    );

    const { email, invitationLink, wishlistTitle, inviterName } =
      await req.json();

    console.log('Request data:', {
      email,
      invitationLink,
      wishlistTitle,
      inviterName,
    });

    if (!email || !invitationLink || !wishlistTitle) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.log('Gmail credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailHtml = `
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
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This invitation expires in 7 days. If you have any questions, reach out to the person who invited you.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email using Gmail SMTP
    await new Promise<void>((resolve, reject) => {
      transport.sendMail(
        {
          from: `Wishly <${GMAIL_USER}>`,
          to: email,
          subject: `🎁 You've been invited to help with ${wishlistTitle}!`,
          html: emailHtml,
        },
        (error: Error | null) => {
          if (error) {
            console.log('Gmail SMTP error:', error);
            return reject(error);
          }
          resolve();
        }
      );
    });

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.log('Function error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
