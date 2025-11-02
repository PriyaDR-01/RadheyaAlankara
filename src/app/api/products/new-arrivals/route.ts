import { NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export async function GET() {
  try {
    const { products } = loadData();
    const newArrivals = products.filter(p => p.isNewArrival === 1);
    return NextResponse.json(newArrivals);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new arrivals' },
      { status: 500 }
    );
  }
}
