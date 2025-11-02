import { NextRequest, NextResponse } from 'next/server';
import { loadData } from '@/lib/data-loader';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { orders } = loadData();
    const order = orders.find(o => o.id === params.id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
