import Column from "./column.js";
import Row from "./row.js";
import config from "./config.js";

// This works:
// https://stackoverflow.com/questions/46583052/http-google-sheets-api-v4-how-to-access-without-oauth-2-
// Note: ensure that your Google Sheets "Share" setting is Public Read-only.

class Table {
    constructor() {
        this.columns = [];
        this.rows = [];
        this.columnMap = {};

        // throws error if not valid:
        this.validateConfig();

        // this.initColumns();
        this.fetchData();

        window.onscroll = this.updateFilterBoxPosition.bind(this);

        // if filter box is visible, hide it:
        document.body.onclick = this.hideFilterMenus.bind(this);
    }

    initColumns() {
        this.columns = config.columns.map((col, idx) => new Column(col, idx));
        this.columns.forEach((col) => (this.columnMap[col.id] = col));
    }

    initRows(data) {
        this.rows = [];
        data.forEach((rec) => {
            this.rows.push(new Row(rec, this.columns));
        });
    }

    initColumnsAndRows(data) {
        this.initColumns();
        this.initRows(data);
        this.columns.forEach(
            ((col) => {
                col.initFilters(this.rows);
            }).bind(this)
        );
    }

    clearColumnData() {
        this.columns.forEach((col) => (col.cells = []));
    }

    columnsToListOfRows() {
        return this.rows.map((row) => row.cells);
    }

    filterData() {
        this.rows.forEach((row) => {
            row.applyFilter();
        });
    }

    validateConfig() {
        if (!config.key) {
            throw new Error(
                "please define a variable called key that has your Google API key"
            );
        }
        if (!config.sheetsId) {
            throw new Error(
                "please define a variable called sheetsId that has your Google sheets ID"
            );
        }

        if (!config.tabName) {
            throw new Error(
                "please define a variable called tabName that has the name of the tab (e.g., Sheet1)"
            );
        }
    }

    async fetchData() {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetsId}/values/${config.tabName}?key=${config.key}`;

        const response = await fetch(url, {
            referrer: "https://vanwars.github.io/google-sheets/",
        });
        const data = await response.json();
        const rows = data.values;
        rows.shift();
        this.initColumnsAndRows(rows);
        this.renderTable();
    }

    renderTable() {
        this.sortByColumn();
        this.filterData();

        // build rows:
        const tableRows = this.rows
            .filter((row) => row.isVisible)
            .map((row) => row.getTableRow());

        // build header row:
        const headerRow = `<tr>
            ${this.columns
                .map((col) => col.getHeaderCell(config.sortColumn))
                .join("\n")}
        </tr>`;

        // add table:
        document.body.innerHTML = `
            <table>
                <thead>${headerRow}</thead>
                <tbody>${tableRows.join("")}</tbody>
            </table>
        `;
        this.attachEventHandlers();
    }

    attachEventHandlers() {
        document.querySelectorAll("a.sort").forEach(
            ((a) => {
                a.onclick = this.sortTable.bind(this);
            }).bind(this)
        );
        document.querySelectorAll(".fa-filter").forEach(
            ((a) => {
                a.onclick = this.showFilterBox.bind(this);
            }).bind(this)
        );
    }

    sortTable(ev) {
        document.querySelector("table").remove();

        const elem = ev.currentTarget;
        config.sortColumn = elem.getAttribute("data-key");
        const col = this.columnMap[config.sortColumn];
        this.renderTable();

        if (col.sortDirection === "asc") {
            col.sortDirection = "desc";
        } else {
            col.sortDirection = "asc";
        }
        ev.preventDefault();
    }

    sortByColumn() {
        const key = config.sortColumn;
        const col = this.columnMap[key];
        const multiplier = col.sortDirection === "desc" ? -1 : 1;
        const stringSorter = (a, b) => {
            const val1 = a[col.ordering].toLowerCase();
            const val2 = b[col.ordering].toLowerCase();
            return val1.localeCompare(val2) * multiplier;
        };

        // convert to array of arrays to sort:
        const data = this.columnsToListOfRows();
        data.sort(stringSorter);

        // convert back to rows:
        this.rows = data.map((rec) => new Row(rec, this.columns));
    }

    showFilterBox(ev) {
        const elem = ev.currentTarget;
        const key = elem.getAttribute("data-key");
        const col = this.columnMap[key];
        let div = document.getElementById(`filter-${key}`);
        if (div) {
            this.hideFilterMenus();
        } else {
            this.hideFilterMenus();
            this.renderFilterBox(col);
        }
        ev.preventDefault();
        ev.stopPropagation();
    }

    renderFilterBox(col) {
        let cbList = [];
        col.filters.forEach((option) => {
            cbList.push(`<input type="checkbox" value="${option}"
                ${col.activeFilters.includes(option) ? "checked" : ""}>
                ${option}<br>`);
        });
        const ratio = (col.activeFilters.length * 1.0) / col.filters.length;
        const batchOption = ratio > 0.5 ? "deselect" : "select";
        const batchButton = `<a id="filter-${col.id}-${batchOption}" href="#">
            ${batchOption} all</a>`;
        const div = `
            <div class="box" id="filter-${col.id}" data-key="${col.id}">
                    ${batchButton}<br><br>
                    ${cbList.join("")}
            </div>`;
        document.body.insertAdjacentHTML("beforeend", div);
        // set the position:
        this.updateFilterBoxPosition(col);

        // add event handlers:
        document.querySelectorAll(`#filter-${col.id} input`).forEach((cb) => {
            cb.onclick = this.updateFilterAndRedraw.bind(this);
        });
        document.getElementById(`filter-${col.id}`).onclick = (ev) => {
            ev.stopPropagation();
        };

        if (batchOption === "deselect") {
            document.querySelector(`#filter-${col.id}-deselect`).onclick =
                this.handleBatchFilterUpdate.bind(this);
        } else {
            document.querySelector(`#filter-${col.id}-select`).onclick =
                this.handleBatchFilterUpdate.bind(this);
        }
    }

    handleBatchFilterUpdate(ev) {
        const elem = ev.currentTarget;
        const id = elem.parentElement.id;
        // const key = elem.parentElement.getAttribute("data-key");
        const flag = elem.innerHTML.indexOf("deselect") >= 0 ? false : true;
        document.querySelectorAll(`#${id} input`).forEach((cb) => {
            cb.checked = flag;
        });
        this.updateFilterAndRedraw(ev);
        ev.preventDefault();
    }

    updateFilterAndRedraw(ev) {
        const elem = ev.currentTarget;
        const key = elem.parentElement.getAttribute("data-key");
        const id = elem.parentElement.id;
        const col = this.columnMap[key];
        col.activeFilters = [];
        document.querySelectorAll(`#${id} input`).forEach((cb) => {
            if (cb.checked) {
                col.activeFilters.push(cb.value);
            }
        });
        document.querySelector("table").remove();
        this.renderTable();

        // redraw filter box
        if (document.getElementById(id)) {
            document.getElementById(id).remove();
        }
        this.renderFilterBox(col);
        ev.stopPropagation();
    }

    hideFilterMenus() {
        document.querySelectorAll(`div[id^=filter-]`).forEach((div) => {
            div.remove();
        });
    }

    updateFilterBoxPosition(col) {
        let div = document.querySelector(`div[id^=filter-]`);
        if (div) {
            const id = div.getAttribute("data-key");
            const parent = document.querySelector(`#th-${id}`);
            const w = parent.offsetWidth + 2;
            const y =
                parent.getBoundingClientRect().top +
                window.scrollY +
                parent.offsetHeight -
                2;
            const x = parent.getBoundingClientRect().left;
            const offsetX =
                (window.pageXOffset || document.documentElement.scrollLeft) -
                (document.documentElement.clientLeft || 0);
            div.style.left = `${x + offsetX}px`;
            div.style.top = `${y}px`;
            div.style.width = `${col.filterBoxWidth || w}px`;
        }
    }
}

// initialize the table:
new Table();
