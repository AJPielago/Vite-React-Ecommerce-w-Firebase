/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(0, 0%, 86%)',
        input: 'hsl(0, 0%, 96%)',
        ring: 'hsl(221.2, 83.2%, 53.3%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(222.2, 84%, 4.9%)',
        primary: {
          DEFAULT: 'hsl(221.2, 83.2%, 53.3%)',
          foreground: 'hsl(210, 40%, 98%)',
          50: 'hsl(210, 100%, 98%)',
          100: 'hsl(210, 100%, 96%)',
          200: 'hsl(210, 96%, 93%)',
          300: 'hsl(210, 90%, 88%)',
          400: 'hsl(210, 86%, 81%)',
          500: 'hsl(221.2, 83.2%, 53.3%)',
          600: 'hsl(221.2, 83.2%, 53.3%)',
          700: 'hsl(221.2, 83.2%, 53.3%)',
          800: 'hsl(221.2, 83.2%, 53.3%)',
          900: 'hsl(224.3, 76.3%, 48%)',
        },
        secondary: {
          DEFAULT: 'hsl(250, 74%, 63%)',
          foreground: 'hsl(210, 40%, 98%)',
          50: 'hsl(250, 100%, 98%)',
          100: 'hsl(250, 100%, 96%)',
          200: 'hsl(250, 100%, 93%)',
          300: 'hsl(250, 100%, 88%)',
          400: 'hsl(250, 100%, 81%)',
          500: 'hsl(250, 74%, 63%)',
          600: 'hsl(250, 74%, 63%)',
          700: 'hsl(250, 74%, 63%)',
          800: 'hsl(250, 74%, 63%)',
          900: 'hsl(250, 74%, 63%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(210, 40%, 98%)',
        },
        muted: {
          DEFAULT: 'hsl(210, 20%, 96%)',
          foreground: 'hsl(215.4, 16.3%, 46.9%)',
        },
        accent: {
          DEFAULT: 'hsl(210, 40%, 96%)',
          foreground: 'hsl(222.2, 47.4%, 11.2%)',
        },
        popover: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(222.2, 84%, 4.9%)',
        },
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(222.2, 84%, 4.9%)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(139, 92, 246, 0.5)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
