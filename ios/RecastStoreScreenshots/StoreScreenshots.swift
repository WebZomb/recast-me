import XCTest

final class StoreScreenshots: XCTestCase {
    private func capture(_ name: String, app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testStoreScreens() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let consent = app.buttons["acceptPhotoProcessing"]
        XCTAssertTrue(consent.waitForExistence(timeout: 20))
        capture("qa-photo-consent", app: app)
        // The disclosure scrolls on smaller screens. Readiness does not bypass consent.
        for _ in 0..<6 {
            if consent.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(consent.isHittable)
        consent.tap()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30))
        let loading = app.staticTexts["Opening your studio…"]
        let finished = NSPredicate(format: "exists == false")
        expectation(for: finished, evaluatedWith: loading)
        waitForExpectations(timeout: 60)
        XCTAssertFalse(app.staticTexts["We couldn’t open the studio"].exists)
        capture("qa-create", app: app)
        for _ in 0..<7 { app.webViews.firstMatch.swipeDown() }
        capture("store-home", app: app)

        app.buttons["Specials"].firstMatch.tap()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30))
        expectation(for: finished, evaluatedWith: loading)
        waitForExpectations(timeout: 60)
        XCTAssertFalse(app.staticTexts["We couldn’t open the studio"].exists)
        capture("store-specials", app: app)

        app.buttons["Guide"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Photo guide"].waitForExistence(timeout: 10))
        capture("store-guide", app: app)
    }
}
