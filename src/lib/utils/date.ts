export function formatDateReadable(dateString: string) {

const dateObject = new Date(dateString);    

const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
};

const formattedDate = dateObject.toLocaleDateString('en-US', options)

return formattedDate;

}

export  function formatDateISO(dateInput: Date) {
    return dateInput.toISOString();
}




