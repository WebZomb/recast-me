import XCTest

final class StoreScreenshots: XCTestCase {
    func capture(_ name: String) {
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
    func testCurrentAppScreens() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let consent = app.buttons["acceptPhotoProcessing"]
        XCTAssertTrue(consent.waitForExistence(timeout: 20))
        for _ in 0..<5 { if consent.isHittable { break }; app.swipeUp() }
        consent.tap()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.waitForExistence(timeout: 45))
        let loaded = web.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", "Your photo")).firstMatch
        XCTAssertTrue(loaded.waitForExistence(timeout: 45))
        Thread.sleep(forTimeInterval: 20)
        // Actual released UI only. No synthetic interface, customer gallery,
        // renders, order submission or modification of production state.
        for _ in 0..<12 { web.swipeDown() }
        Thread.sleep(forTimeInterval: 3)
        capture("01-create-your-photo-gift")
        let products = web.links["See products"]
        if products.exists {
            products.tap()
            Thread.sleep(forTimeInterval: 8)
            capture("02-preview-products-before-buying")
            web.swipeUp()
            Thread.sleep(forTimeInterval: 3)
            capture("03-more-personalized-products")
        }
        for _ in 0..<15 { web.swipeDown() }
        let create = web.links.matching(NSPredicate(format: "label CONTAINS[c] %@", "Make My Picture")).firstMatch
        if create.exists { create.tap() }
        Thread.sleep(forTimeInterval: 3)
        capture("04-create-or-use-original-photo")
        let original = web.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "Use My Photo")).firstMatch
        if original.exists {
            original.tap()
            Thread.sleep(forTimeInterval: 3)
            capture("05-original-photo-gifts")
        }
        // Guide is supporting only; never substitute an empty library.
        let help = app.buttons["Open photo guide and support"]
        XCTAssertTrue(help.waitForExistence(timeout: 10))
        help.tap()
        XCTAssertTrue(app.navigationBars["Photo guide"].waitForExistence(timeout: 10))
        capture("06-photo-guide-supporting")
    }
}
