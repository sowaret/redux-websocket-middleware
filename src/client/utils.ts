const capitalizeString = (string: string) =>
	string.charAt(0).toUpperCase() + string.slice(1);

export const capitalize = (input: string | string[]) => {
	if (typeof input === 'string') return capitalizeString(input);
	if (Array.isArray(input)) return input.map(string =>
		capitalizeString(string)
	);
	throw 'capitalize() parameter must be a string or an array';
};

export const lowercase = (input: string | string[]) => {
	if (typeof input === 'string') return input.toLowerCase();
	if (Array.isArray(input)) return input.map(string =>
		string.toLowerCase()
	);
	throw 'lowercase() parameter must be a string or an array';
};
