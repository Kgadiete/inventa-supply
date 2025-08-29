import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, company_name, token, invite_url } = await req.json()

    // Configure Google SMTP client
    const client = new SmtpClient()
    
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 587,
      username: "theolusmpanza@gmail.com",
      password: "yssb iwue wxte wesr", // App password with spaces
    })

    // Send invitation email
    await client.send({
      from: "theolusmpanza@gmail.com",
      to: email,
      subject: `You're invited to join ${company_name || 'our platform'}`,
      content: `
        <h2>You're Invited!</h2>
        <p>You have been invited to join ${company_name || 'our platform'} as a ${role.replace('_', ' ')}.</p>
        <p>Click the link below to accept your invitation and create your account:</p>
        <p><a href="${invite_url}">Accept Invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you have any questions, please contact your administrator.</p>
      `,
      html: `
        <h2>You're Invited!</h2>
        <p>You have been invited to join ${company_name || 'our platform'} as a ${role.replace('_', ' ')}.</p>
        <p>Click the link below to accept your invitation and create your account:</p>
        <p><a href="${invite_url}">Accept Invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you have any questions, please contact your administrator.</p>
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ message: 'Invitation email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to send invitation email' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
