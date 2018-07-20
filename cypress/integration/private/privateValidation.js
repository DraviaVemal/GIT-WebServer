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
    it("createNewRepo", function () {
        cy.url()
            .then(function ($url) {

            });
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
        cy.get("[data-test=createRepoSubmit]")
            .should("exist")
            .should("be.visible")
            .should('not.disabled')
            .click();
    });
});