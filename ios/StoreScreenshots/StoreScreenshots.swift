import XCTest

final class StoreScreenshots: XCTestCase {
    func capture(_ name: String) {
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
    }
    func testCurrentAppScreens() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["acceptPhotoProcessing"].waitForExistence(timeout: 20))
        capture("01-photo-permission")
        let consent = app.buttons["acceptPhotoProcessing"]
        for _ in 0..<5 { if consent.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(consent.isHittable)
        consent.tap()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 45))
        // Wait for actual loaded web content; never capture an error as a store image.
        let loaded = app.webViews.firstMatch.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", "Your photo")).firstMatch
        XCTAssertTrue(loaded.waitForExistence(timeout: 45))
        XCTAssertFalse(app.staticTexts["We couldn’t open the studio"].exists)
        capture("02-create")
        app.buttons["My Recasts"].firstMatch.tap()
        capture("03-my-recasts-empty")
        app.buttons["Create"].firstMatch.tap()
        let help = app.buttons["Open photo guide and support"]
        XCTAssertTrue(help.waitForExistence(timeout: 10))
        help.tap()
        XCTAssertTrue(app.navigationBars["Photo guide"].waitForExistence(timeout: 10))
        capture("04-photo-guide")
    }
}
