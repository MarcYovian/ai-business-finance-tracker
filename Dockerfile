# Gunakan image resmi Bun (karena project Anda menggunakan bun.lockb)
FROM oven/bun:latest

# Set direktori kerja di dalam container
WORKDIR /app

# Copy file package.json dan bun.lockb terlebih dahulu
COPY package.json bun.lockb* ./

# Install dependencies (ini akan di-cache oleh Docker)
RUN bun install

# Copy sisa source code project Anda ke dalam container
COPY . .

# Expose port 8080 (sesuai vite.config.ts)
EXPOSE 8080

# Perintah default untuk menjalankan dev server saat container startup
CMD ["bun", "run", "dev"]