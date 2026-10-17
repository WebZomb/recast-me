import SwiftUI
import Combine

// Session-only consent: no web studio is instantiated before an explicit choice.
// Saved offline previews and the native Guide remain accessible without consent.
@MainActor
final class PhotoProcessingConsent: ObservableObject {
    @Published var accepted = false
}

struct PhotoConsentView: View {
    let accept: () -> Void
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Image(systemName: "photo.badge.checkmark")
                    .font(.system(size: 44)).foregroundStyle(.cyan)
                    .accessibilityHidden(true)
                Text("Your photos. Your choice.")
                    .font(.largeTitle.bold())
                Text("Before you open the studio")
                    .font(.headline).foregroundStyle(.cyan)
                Text("When you select photos for AI creation, a small copy may be sent to Cloudflare Workers AI to suggest who is pictured. When you request a Recast, your photos and instructions are sent to fal.ai or Cloudflare Workers AI to create the image.")
                Text("When safety screening is enabled, photos and generated images are also sent to OpenAI for content checks. Original-photo gifts skip AI rendering but may still use safety screening. Recast Me stores your artwork privately to provide previews and fulfill your orders.")
                Text("By continuing, you agree to this photo processing when you choose to upload. Only use photos you own or have permission to use. Review the privacy policy for storage, deletion and provider details.")
                    .foregroundStyle(.secondary)
                Link("Read photo privacy and deletion details", destination: StudioView.origin.appendingPathComponent("privacy.html"))
                Button(action: accept) {
                    Text("Agree & Open Studio").frame(maxWidth: .infinity, minHeight: 44)
                }
                    .buttonStyle(.borderedProminent).tint(.cyan)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .accessibilityIdentifier("acceptPhotoProcessing")
                Text("Not ready to upload? You can still view your saved pictures in My Recasts or read the Guide.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .padding(28).frame(maxWidth: 640, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(Color(.systemBackground))
    }
}
