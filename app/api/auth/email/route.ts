import { NextResponse } from 'next/server'

// Store verification codes temporarily (in production, use a database)
const verificationCodes = new Map<string, { code: string; timestamp: number }>()

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const verificationCode = generateVerificationCode()
    
    // Store code with timestamp
    verificationCodes.set(email, {
      code: verificationCode,
      timestamp: Date.now()
    })

    // Send email using EmailJS
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'YOUR_SERVICE_ID',
        template_id: 'YOUR_TEMPLATE_ID',
        user_id: 'YOUR_PUBLIC_KEY',
        template_params: {
          to_email: email,
          verification_code: verificationCode,
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { email, code } = await request.json()
    
    const storedData = verificationCodes.get(email)
    
    if (!storedData) {
      return NextResponse.json(
        { success: false, message: 'No verification code found' },
        { status: 400 }
      )
    }

    // Check if code is expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email)
      return NextResponse.json(
        { success: false, message: 'Verification code expired' },
        { status: 400 }
      )
    }

    // Verify code
    if (storedData.code !== code) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Clean up
    verificationCodes.delete(email)

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully',
      user: { email } 
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    )
  }
}