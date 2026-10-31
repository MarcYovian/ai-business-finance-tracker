import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | AI Business Finance Tracker',
  description: 'Terms of Service for AI Business Finance Tracker',
};

export default async function TermsOfServicePage() {
  const filePath = path.join(process.cwd(), 'public', 'TERMS.md');
  let markdown = '';
  try {
    markdown = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    markdown = '# Terms of Service\n\nContent could not be loaded.';
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <article className="prose dark:prose-invert lg:prose-lg mx-auto">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
