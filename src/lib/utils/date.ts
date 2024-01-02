export function formatDateReadable(dateString: string) {
	const dateObject = new Date(dateString);

	return dateObject
		.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric'
		})
		.replace(/\//g, '-');
}

export function formatDateISO(dateInput: Date) {
	return dateInput.toISOString();
}

export function formatDateOnly(dateInput: Date) {
	const dataString = dateInput.toString();
	const dateParts = dataString.split(' ');
	const dayOfWeek = dateParts[0];
	// Map month abbreviations to numeric values
	const monthMap: Record<string, string> = {
		Jan: '01',
		Feb: '02',
		Mar: '03',
		Apr: '04',
		May: '05',
		Jun: '06',
		Jul: '07',
		Aug: '08',
		Sep: '09',
		Oct: '10',
		Nov: '11',
		Dec: '12'
	};
	const month = monthMap[dateParts[1]];
	const day = dateParts[2];
	const year = dateParts[3];

	// Concatenate the date components in the desired format
	return `${year}-${month}-${day}`;
}

export function formatDateRegular(dateInput: String) {
	const dataString = dateInput.toString();
	const dateParts = dataString.split(' ');
	const dayOfWeek = dateParts[0];
	// Map month abbreviations to numeric values
	const monthMap: Record<string, string> = {
		Jan: '01',
		Feb: '02',
		Mar: '03',
		Apr: '04',
		May: '05',
		Jun: '06',
		Jul: '07',
		Aug: '08',
		Sep: '09',
		Oct: '10',
		Nov: '11',
		Dec: '12'
	};
	const month = monthMap[dateParts[1]];
	const day = dateParts[2];
	const year = dateParts[3];

	// Concatenate the date components in the desired format
	const formattedDate = `${year}-${month}-${day}`;

	return new Date(formattedDate);
}

export function combineDateAndTime(d: string, e: string) {
	// Create a Date object for the given time string
	const dateE = new Date(e);

	// Extract the time portion from the Date object
	const timeE = dateE.toTimeString().split(' ')[0];

	// Combine the date and time
	const combinedDateTime = `${d} ${timeE}`;

	return combinedDateTime;
}

export function isGreaterThanOrEqToday(givenDateString: string) {
	const givenDate = new Date(givenDateString);

	// Get the current date
	const currentDate = new Date();

	// Set the time components of the current date to 00:00:00 to compare only the dates
	currentDate.setHours(0, 0, 0, 0);

	if (givenDate >= currentDate) {
		return true;
	} else {
		return false;
	}
}

export function convertToReadableDateTime(input: string) {
	const inputDate = new Date(input);

	const options = {
		weekday: 'short' as const,
		month: 'short' as const,
		day: 'numeric' as const,
		hour: 'numeric' as const,
		minute: 'numeric' as const,
		hour12: true
	};

	return inputDate.toLocaleString('en-US', options);
}

export function combineDateAndTimeDirect(d: string, t: string) {
	const dateE = new Date(d + ' ' + t);
	const timeE = dateE.toTimeString().split(' ')[0];
	return `${d} ${timeE}`;
}

export function getBeforeDaySince(givenDate: string, count: number) {
	const dateObj = new Date(givenDate);

	// Calculate the date 5 days before
	const fiveDaysBefore = new Date(dateObj);
	fiveDaysBefore.setDate(dateObj.getDate() - count);

	// Format the result as a string
	const formattedResult = fiveDaysBefore.toISOString().split('T')[0];

	return formattedResult;
}

export function getAfterDaySince(givenDate: string, count: number) {
	const dateObj = new Date(givenDate);

	// Calculate the date 5 days before
	const fiveDaysBefore = new Date(dateObj);
	fiveDaysBefore.setDate(dateObj.getDate() + count);

	// Format the result as a string
	const formattedResult = fiveDaysBefore.toISOString().split('T')[0];

	return formattedResult;
}
