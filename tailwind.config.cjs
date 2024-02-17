/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: '#00ff00'
			}
		},
	},

	plugins: [],
};

module.exports = config;
