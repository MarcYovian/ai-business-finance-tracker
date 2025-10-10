import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const PrivacyPolicyPage = () => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch('/PRIVACY.md')
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <article className="prose dark:prose-invert lg:prose-lg mx-auto">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
