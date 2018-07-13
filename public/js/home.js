function loadPage(uri) {
    history.pushState(null, null, uri);
}

/**
 * Delete Repository confirmation dropdown
 */
function deleteRepo() {
    bootbox.confirm({
        message: "Are you sure about deleting the repository?",
        buttons: {
            confirm: {
                label: 'Yes',
                className: 'btn-danger'
            },
            cancel: {
                label: 'No',
                className: 'btn-success'
            }
        },
        callback: function (result) {
            if (result) $("#repoDelete").submit();
        }
    });
    return false;
}