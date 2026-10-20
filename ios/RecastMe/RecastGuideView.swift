import SwiftUI

struct RecastGuideView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
NavigationStack {
                    List {
                        Section("Make something worth keeping") {
                            Label("Choose clear photos of your pet or people.", systemImage: "photo")
                            Label("Choose a world and check who to include.", systemImage: "sparkles")
                            Label("Check likeness before choosing merchandise.", systemImage: "checkmark.seal")
                        }
                        Section("Your private collection") {
                            Text("My Recasts keeps up to 20 offline watermarked previews. Open a saved picture and tap Put on a product without using another render. Its private link is kept in this iPhone's Keychain.")
                            Text("Deleting a local picture also removes its iPhone-only product link, but server artwork and paid orders remain. Keep private links safe; an Artwork ID alone does not unlock a picture.")
                            Link("Photo privacy & AI processing", destination: StudioView.origin.appendingPathComponent("privacy.html"))
                        }
                        Section("Creating and ordering") {
                            Text("The My Orders tab shows your purchases, production progress, and carrier tracking once a shipment actually exists. Keep Create open while an image renders. Return from secure checkout to refresh order status.")
                        }
                        Section("Special occasions & gifts") {
                            Link("Seasonal gifts and special occasions",
                                 destination: StudioView.origin.appendingPathComponent("specials.html"))
                            Text("Explore seasonal Recasts and personalized gift ideas. Choose a look and preview the result before you order.")
                        }
                        Section("Orders & support") {
                            Link("Order help and shipping", destination: StudioView.origin.appendingPathComponent("support.html"))
                            Link("Report a problem or content concern", destination: StudioView.origin.appendingPathComponent("support.html"))
                        }
                    }
                    .navigationTitle("Photo guide")
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
                }
    }
}
