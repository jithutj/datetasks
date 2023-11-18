export function formatDateReadable(dateString: string) {

const dateObject = new Date(dateString);    

const formattedDate = dateObject.toDateString()

return formattedDate;

}

export  function formatDateISO(dateInput: Date) {
    return dateInput.toISOString();
}

export  function formatDateISODateOnly(dateInput: Date) {
    return dateInput.toISOString().split('T')[0];
}

export function formatDateRegular(dateInput: String) {
    const dataString = dateInput.toString();
    const dateParts = dataString.split(' ');
    const dayOfWeek = dateParts[0];
// Map month abbreviations to numeric values
const monthMap: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
const month = monthMap[dateParts[1]];
const day = dateParts[2];
const year = dateParts[3];

// Concatenate the date components in the desired format
const formattedDate = `${year}-${month}-${day}`;

return new Date(formattedDate);
}


