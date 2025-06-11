/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/email',
        destination: 'https://api.guerrillamail.com/ajax.php',
      },
    ];
  },
};

export default nextConfig;
