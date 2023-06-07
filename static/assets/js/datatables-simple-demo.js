window.addEventListener('DOMContentLoaded', event => {
    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        const dataTable = new simpleDatatables.DataTable(datatablesSimple, {
            sortable: false,
        });

        const tableHeadings = datatablesSimple.querySelectorAll('th');
        tableHeadings.forEach(th => {
            th.style.backgroundColor = '#3d5ee1'; // Change the background color to your desired color
            th.style.color = 'white'; // Change the text color to your desired color
        });
    }
});
