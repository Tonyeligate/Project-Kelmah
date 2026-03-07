import Foundation

struct APIEnvironment {
    let gatewayOrigin: URL
    let apiBaseURL: URL
    let socketBaseURL: URL
    let environmentName: String

    private static let defaultGatewayOriginString = "https://kelmah-api-gateway-qmd7.onrender.com"

    static var current: APIEnvironment {
        let bundle = Bundle.main
        let env = bundle.object(forInfoDictionaryKey: "KelmahEnvironment") as? String ?? "production"
        let configuredGatewayOrigin = bundle.object(forInfoDictionaryKey: "KelmahGatewayOrigin") as? String
        let gatewayOrigin = normalizeGatewayOrigin(configuredGatewayOrigin)

        return APIEnvironment(
            gatewayOrigin: gatewayOrigin,
            apiBaseURL: gatewayOrigin.appendingPathComponent("api"),
            socketBaseURL: gatewayOrigin.appendingPathComponent("socket.io"),
            environmentName: env
        )
    }

    private static func normalizeGatewayOrigin(_ rawValue: String?) -> URL {
        var candidate = rawValue?.trimmingCharacters(in: .whitespacesAndNewlines)
        if candidate?.hasSuffix("/api") == true {
            candidate?.removeLast(4)
        }
        while candidate?.hasSuffix("/") == true {
            candidate?.removeLast()
        }

        return URL(string: candidate?.isEmpty == false ? candidate! : defaultGatewayOriginString)
            ?? URL(string: defaultGatewayOriginString)!
    }
}
