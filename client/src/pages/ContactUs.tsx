import React from 'react';

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow p-8">
        <h1 className="font-serif text-3xl md:text-4xl font-light mb-4">Contact Us</h1>
        <p className="mb-4 text-muted-foreground">We're here to help! Reach out to us for any questions, support, or feedback.</p>
        <ul className="mb-4 text-sm">
          <li><span className="font-medium">Email:</span> <a href="mailto:support@finejewelry.com" className="text-primary underline">support@finejewelry.com</a></li>
          <li><span className="font-medium">Phone:</span> <a href="tel:+1234567890" className="text-primary underline">+1 (234) 567-890</a></li>
          <li><span className="font-medium">Live Chat:</span> Available 9am–6pm, Mon–Sat</li>
        </ul>
        <a href="mailto:support@finejewelry.com" className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition">Email Us</a>
      </div>
    </div>
  );
}
