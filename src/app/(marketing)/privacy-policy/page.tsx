import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Business Finance Tracker',
  description: 'Privacy Policy for AI Business Finance Tracker',
};

export default async function PrivacyPolicyPage() {
  const filePath = path.join(process.cwd(), 'public', 'PRIVACY.md');
  let markdown = '';
  try {
    markdown = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    markdown = '# Privacy Policy\n\nContent could not be loaded.';
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
