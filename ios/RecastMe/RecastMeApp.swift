import SwiftUI

@main
struct RecastMeApp: App {
    @StateObject private var gallery = PreviewGallery()
    var body: some Scene {
        WindowGroup {
            TabView {
                StudioView(gallery: gallery)
                    .tabItem { Label("Create", systemImage: "wand.and.stars") }
                GalleryView(gallery: gallery)
                    .tabItem { Label("My Recasts", systemImage: "photo.on.rectangle.angled") }
                NavigationStack {
                    List {
                        Section("Make something worth keeping") {
                            Label("Choose clear photos of your pet or people.", systemImage: "photo")
                            Label("Choose a world and check who to include.", systemImage: "sparkles")
                            Label("Check likeness before choosing merchandise.", systemImage: "checkmark.seal")
                        }
                        Section("Your private collection") {
                            Text("Save a finished watermarked preview from Create. My Recasts keeps up to 20 previews on this device for offline viewing and sharing.")
                            Text("Deleting a local preview does not delete the artwork on Recast Me or cancel an order. Use the private order page to delete unpaid server artwork.")
                            Link("Photo privacy & AI processing", destination: StudioView.origin.appendingPathComponent("privacy.html"))
                        }
                        Section("Testing this app") {
                            Text("This build connects to Recast Me. App checkout and return still need device testing before release. Keep Create open while an image renders; background completion is not supported yet.")
                        }
                        Section("Orders & support") {
                            Link("Order help and shipping", destination: StudioView.origin.appendingPathComponent("support.html"))
                        }
                    }
                    .navigationTitle("Photo guide")
                }.tabItem { Label("Guide", systemImage: "questionmark.circle") }
            }
            .tint(.cyan)
            .preferredColorScheme(.dark)
        }
    }
}
