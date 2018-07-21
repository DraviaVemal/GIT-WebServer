describe("createRepository", function () {
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
    it("createRepoPage", function () {
        var createRepo = function () {
            cy.get("[data-test=userCreateRepo")
                .should("exist")
                .should("be.visible")
                .click();
            cy.url()
                .should("include", "/user/createRepo");
            cy.get("[data-test=createRepoName]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled')
                .should("be.empty")
                .type("test");
            cy.get("[data-test=createRepoTypePublic]")
                .should("exist")
                .should('not.disabled')
                .should("be.visible");
            cy.get("[data-test=createRepoTypePrivate]")
                .should("exist")
                .should('not.disabled')
                .should("be.visible");
            cy.get("[data-test=createRepoDescription]")
                .should("exist")
                .should("be.visible")
                .should("be.empty")
                .should('not.disabled')
                .type("test Description");
            cy.get("[data-test=createRepoReadMe]")
                .should("exist")
                .should("be.visible")
                .should("be.empty")
                .should('not.disabled')
                .type("test Description");
            cy.get("[data-test=createRepoMessage]")
                .should("not.exist");
            cy.get("[data-test=createRepoSubmit]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled')
                .click();
        };
        createRepo();
        cy.url()
            .should("include", "/git/test/readme");
        createRepo();
        cy.get("[data-test=createRepoMessage]")
            .should("exist");
    });
});