import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3]">
      <div className="text-center p-8 bg-white rounded-2xl border border-[#E5EAE3] shadow-sm max-w-md mx-4">
        <h1 className="mb-2 text-4xl font-extrabold text-[#161F18]">404</h1>
        <p className="mb-6 text-base text-[#657267]">Halaman yang Anda tuju tidak ditemukan.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#2C6E20] text-white text-sm font-semibold hover:bg-[#235819] transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
