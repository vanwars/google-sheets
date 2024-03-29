// https://docs.google.com/spreadsheets/d/1M6lIxSbYaTI3lTkPvDbd-Ex4P0EX-2R9oEvxKYbncEc/edit#gid=0
export default {
    key: "AIzaSyDsr4u1uupvnmDSfJdfgHZN2IWROiihlP8",
    sheetsId: "1sCzg49oABRtnIVxWeCT7EJDfijWzbP3MHoj0ks5PKY4",
    tabName: "Form Responses 1",
    sortColumn: "name",
    columns: [
        { id: "timestamp", name: "Timestamp" },
        { id: "name", name: "Name", filterable: true, filterBoxWidth: 200 },
        {
            id: "url",
            name: "Link",
            dataType: "url",
            linkText: "link to position",
        },
        {
            id: "title",
            name: "Title",
            colWidth: 200,
            filterable: true,
            filterBoxWidth: 400,
        },
        {
            id: "organization",
            name: "Organization",
            colWidth: 200,
            filterable: true,
            filterBoxWidth: 400,
        },
        {
            id: "time_scale",
            name: "Time Scale",
            colWidth: 200,
            filterable: true,
            filterBoxWidth: 300,
        },
        {
            id: "skills_needed",
            name: "Skills Needed",
            colWidth: 400,
            filterable: true,
            filterBoxWidth: 600,
            dataType: "tags",
        },
        { id: "location", name: "Location" },
        { id: "salary", name: "Salary" },
        {
            id: "classification",
            name: "Classification",
            colWidth: 200,
            filterable: true,
            filterBoxWidth: 300,
            dataType: "tags",
        },
        { id: "why", name: "Why is this interesting?", colWidth: 400 },
    ],
};
