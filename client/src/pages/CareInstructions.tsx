import React from 'react';

export default function CareInstructions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow p-8">
        <h1 className="font-serif text-3xl md:text-4xl font-light mb-4">Care Instructions</h1>
        <p className="mb-4 text-muted-foreground">Keep your jewelry beautiful for years to come with these care tips:</p>
        <ul className="list-disc pl-6 mb-4 text-sm">
          <li>Store jewelry in a dry, soft pouch or box to prevent scratches.</li>
          <li>Avoid contact with chemicals, perfumes, and lotions.</li>
          <li>Clean gently with a soft cloth; avoid abrasive materials.</li>
          <li>Remove jewelry before swimming, showering, or exercising.</li>
          <li>For deep cleaning, use mild soap and water, then dry thoroughly.</li>
        </ul>
        <p className="text-sm text-muted-foreground">If you have questions about caring for your jewelry, <a href="mailto:support@finejewelry.com" className="text-primary underline">contact us</a> for expert advice.</p>
      </div>
    </div>
  );
}
