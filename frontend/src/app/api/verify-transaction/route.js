// app/api/verify-transaction/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
  }

  try {
    // In a real implementation, you would fetch from your database
    // For now, we'll return a mock response
    const transaction = {
      id: id,
      verified: true,
      message: 'Transaksi peminjaman buku terverifikasi',
      details: {
        transactionId: id,
        // In a real implementation, fetch actual transaction details from DB
      }
    };

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 500 });
  }
}