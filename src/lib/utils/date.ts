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



