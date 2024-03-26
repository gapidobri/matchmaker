/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: '#DF7716',
				accent: '#C27E3F',
				'offblack-d': '#090909',
				offblack: '#0e0e0e',
				'error-red': '#D21D12',
				'placeholder': '#634C36'
			}
		},
	},

	plugins: [],
};

module.exports = config;
