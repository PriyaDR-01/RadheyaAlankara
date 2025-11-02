import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data-loader';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { orders } = loadData();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders } = loadData();
    
    const newOrder = {
      id: uuidv4(),
      ...body,
      createdAt: new Date().toISOString()
    };
    
    const updatedOrders = [...orders, newOrder];
    
    if (saveData('orders', updatedOrders)) {
      return NextResponse.json(newOrder, { status: 201 });
    } else {
      throw new Error('Failed to save order');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
