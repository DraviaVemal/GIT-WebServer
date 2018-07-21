describe("loginPage", function () {
    it("loginPageURL", function () {
        cy.visit("/");
        cy.url()
            .should("include", "/");
        cy.visit("/login");
        cy.url()
            .should("include", "/login");
    });
    it("loginForm", function () {
        cy.visit("/");
        cy.get("[data-test=loginEMail]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("draviyam");
        cy.get("[data-test=loginPassword]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("draviyam");
        cy.get("[data-test=loginForgotpass]")
            .should('exist')
            .should('be.visible');
        cy.get("[data-test=loginSignup]")
            .should('exist')
            .should('be.visible');
        cy.get("[data-test=loginMessage]")
            .should('not.exist');
        cy.get("[data-test=loginSubmit]")
            .should('exist')
            .should('not.disabled')
            .should('be.visible')
            .click();
        cy.url()
            .should("include", "/login");
        cy.get("[data-test=loginMessage]")
            .should('exist')
            .should('be.visible');
    });
});
describe("signupPage", function () {
    it("signupPageURL", function () {
        cy.visit("/signup");
        cy.url()
            .should("include", "/signup");
    });
    it("signupForm", function () {
        cy.visit("/signup");
        cy.get("[data-test=signupName]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("Dravia Vemal");
        cy.get("[data-test=signupEMail]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("draviyam@gmail.com");
        cy.get("[data-test=signupUserName]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("draviyam");
        cy.get("[data-test=signupPassword]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("12345678");
        cy.get("[data-test=signupRPassword]")
            .should('exist')
            .should('be.empty')
            .should('be.visible')
            .clear()
            .type("12345678");
        cy.get("[data-test=signupLogin]")
            .should('exist')
            .should('be.visible');
        cy.get("[data-test=signupMessage]")
            .should('not.exist');
        cy.get("[data-test=signupSubmit]")
            .should('exist')
            .should('not.disabled')
            .should('be.visible')
            .click();
        cy.get("[data-test=signupMessage]")
            .should('be.visible')
            .should('exist');
    });
});
describe("hyperLinks", function () {
    it("loginPage", function () {
        cy.visit("/");
        cy.url()
            .should('include', "/");
        cy.get("[data-test=loginForgotpass]")
            .click();
        cy.url()
            .should('include', "/forgotPass");
        cy.visit("/");
        cy.get("[data-test=loginSignup]")
            .click();
        cy.url()
            .should('include', "/signup");
    });
    it ("signupPage", function () {
            cy.visit("/signup");
            cy.url()
                .should('include', "/signup");
            cy.get("[data-test=signupLogin]")
                .click();
            cy.url()
                .should('include', "/login");
        });
});
// describe("forgotPage", function () {
//     it("forgotPageURL", function () {
//         cy.visit("/forgotPass");
//         cy.url()
//             .should("include", "/forgotPass");
//     });
// });