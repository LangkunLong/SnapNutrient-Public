import { NextResponse } from 'next/server';
import { addIntake, getIntakeByDate } from '@/lib/intakeFunctions';

export async function POST(request: Request) {
  const data = await request.json();
  try {
    await addIntake(data);
    return NextResponse.json({ message: 'Intake added successfully!' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
    const url = new URL(request.url); // Parse the URL from the request
    const date = url.searchParams.get('date'); // Retrieve 'date' parameter
    const userId = url.searchParams.get('userId'); // Retrieve 'userId' parameter
    if (!date || !userId) {
      return NextResponse.json({ error: 'Missing date or userId parameter' }, { status: 400 });
    }

    try {
        const intake = await getIntakeByDate(userId, date);
        return NextResponse.json(intake);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}