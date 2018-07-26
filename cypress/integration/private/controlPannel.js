describe("ControlPannel", function () {
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
    it("hyperLinks", function () {
        var checkHyperLink = function () {
            cy.get("[data-test=configAppName]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
            cy.get("[data-test=controlPannelConfig]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
            cy.get("[data-test=controlPannelUser]")
                .should("exist")
                .should("be.visible")
                .should('not.disabled');
        };
        cy.get("[data-test=controlPannel]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled')
            .click();
        //TODO: Update to dynamic test case to check changing url
        cy.url()
            .should("include", "/user/controlPannel/configuration");
        checkHyperLink();
        cy.get("[data-test=controlPannelConfig]")
            .click();
        cy.url()
            .should("include", "/user/controlPannel/configuration");
        //Check Components inside control pannel -> configuration selection
        cy.get("[data-test=controlPannelConfigPort]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelConfigAppName]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigGitURL]")
            .should("exist")
            .should("be.visible")
            .should('disabled');
        cy.get("[data-test=controlPannelCongigDBName]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigDBSelection]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigDBUser]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigDBPassword]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigDBURL]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigDBPort]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        cy.get("[data-test=controlPannelCongigSSLSelection]")
            .should("exist")
            .should("be.visible")
            .should('disabled');
        cy.get("[data-test=controlPannelCongigEMailSelection]")
            .should("exist")
            .should("be.visible")
            .should('disabled');
        cy.get("[data-test=controlPannelCongigUpdateButton]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        checkHyperLink();
        cy.get("[data-test=controlPannelUser]")
            .click();
        cy.url()
            .should("include", "/user/controlPannel/userAccess");
        //Check Components inside control pannel -> User selection
        cy.get("[data-test=controlPannelUserUpdateButton]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled');
        checkHyperLink();
    });
});