window.addEventListener('DOMContentLoaded', event => {
    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        const dataTable = new simpleDatatables.DataTable(datatablesSimple, {
            sortable: false,
            
        });

        // Add color to datatable rows
        const rows = dataTable.rows();
        rows.forEach(row => {
            row.element.style.backgroundColor = '#000';
        });
    }
});
