export function formatDateReadable(dateString: string) {

const dateObject = new Date(dateString);    

const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
};

const formattedDate = dateObject.toLocaleDateString('en-US', options)

return formattedDate;

}

export  function formatDateISO(dateInput: Date) {
    return dateInput.toISOString();
}

export  function formatDateISODateOnly(dateInput: Date) {
    return dateInput.toISOString().split('T')[0];
}




