import React from 'react';

export default function ShippingReturns() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow p-8">
        <h1 className="font-serif text-3xl md:text-4xl font-light mb-4">Shipping & Returns</h1>
        <p className="mb-4 text-muted-foreground">We want you to love your jewelry. Here’s everything you need to know about our shipping and return policies:</p>
        <ul className="list-disc pl-6 mb-4 text-sm">
          <li>Free standard shipping on all domestic orders.</li>
          <li>Express shipping available at checkout for an additional fee.</li>
          <li>Orders are processed within 1-2 business days.</li>
          <li>Returns accepted within 30 days of delivery for unworn items in original packaging.</li>
          <li>To start a return, contact our support team with your order number.</li>
        </ul>
        <p className="text-sm text-muted-foreground">For more details or to initiate a return, please <a href="mailto:support@finejewelry.com" className="text-primary underline">contact us</a>.</p>
      </div>
    </div>
  );
}
