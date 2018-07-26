describe("repoTabsAndActions", function () {
    it("loginUser", function () {
        cy.visit("/");
        cy.get("[data-test=loginEMail]")
            .clear()
            .type("draviyam");
        cy.get("[data-test=loginPassword]")
            .clear()
            .type("12345678");
        cy.get("[data-test=loginSubmit]")
            .click();
        cy.url()
            .should("include", "/");
        Cypress.Cookies.preserveOnce("SID", "SSID");
    });
    it("repoTabPages", function () {
        var repoLinks = function () {
            cy.get("[data-test=gitReadMe]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
            cy.get("[data-test=gitFiles]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
            cy.get("[data-test=gitBranches]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
            cy.get("[data-test=gitHistory]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
            cy.get("[data-test=gitSetting]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
        };
        cy.url()
            .should("include", "/git/test/readme");
        cy.get("[data-test=gitReadMe]")
            .click();
        cy.url()
            .should("include", "/git/test/readme");
        repoLinks();
        cy.get("[data-test=gitFiles]")
            .click();
        cy.url()
            .should("include", "/git/test/files");
        repoLinks();
        cy.get("[data-test=gitBranches]")
            .click();
        cy.url()
            .should("include", "/git/test/branches");
        repoLinks();
        cy.get("[data-test=gitHistory]")
            .click();
        cy.url()
            .should("include", "/git/test/history");
        repoLinks();
        cy.get("[data-test=gitSetting]")
            .click();
        cy.url()
            .should("include", "/git/test/setting");
        repoLinks();
        cy.get("[data-test=gitSettingDeleteSubmit]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled')
            .click();
        cy.get(".data-test-gitSettingDeleteCancel")
            .should("exist")
            .should("be.visible")
            .should('not.disabled')
            .click();
        cy.get("[data-test=gitSettingDeleteSubmit]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled')
            .click();
        cy.get(".data-test-gitSettingDeleteConfirm")
            .should("exist")
            .should("be.visible")
            .should('not.disabled')
            .click();
    });
});