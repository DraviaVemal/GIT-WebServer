describe("userElementCheck", function () {
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
    it("elementCheck", function () {
        cy.get("[data-test=configAppName]")
            .should('exist')
            .should('be.visible');
        cy.get("[data-test=userOption]")
            .should('exist')
            .should('not.visible');
        cy.get("[data-test=currentUserName]")
            .should('exist')
            .should('be.visible')
            .click();
        cy.get("[data-test=userOption]")
            .should('exist')
            .should('be.visible');
        cy.get("[data-test=userProfile]")
            .should('exist')
            .should('be.visible')
            .click();
        cy.url()
            .should("include", "/user/profile");
        cy.get("[data-test=configAppName]")
            .should('exist')
            .should('be.visible')
            .click();
        cy.get("[data-test=currentUserName]")
            .click();
        cy.get("[data-test=userSetting]")
            .should('exist')
            .should('be.visible')
            .click();
        cy.url()
            .should("include", "/user/setting");
        cy.get("[data-test=configAppName]")
            .should('exist')
            .should('be.visible')
            .click();
        cy.get("[data-test=currentUserName]")
            .click();
        cy.get("[data-test=userLogout]")
            .should('exist')
            .should('be.visible')
            .click();
        cy.url()
            .should("include", "/");
    });
});