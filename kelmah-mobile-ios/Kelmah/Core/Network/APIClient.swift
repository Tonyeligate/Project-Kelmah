import Foundation

enum APIClientError: LocalizedError {
    case invalidResponse
    case invalidStatusCode(Int, String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The API response was invalid."
        case let .invalidStatusCode(_, message):
            return message
        }
    }
}

final class APIClient {
    private let environment: APIEnvironment
    private let sessionStore: SessionStore
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    var authRecoveryHandler: (@Sendable () async -> Bool)?

    init(environment: APIEnvironment, sessionStore: SessionStore) {
        self.environment = environment
        self.sessionStore = sessionStore
    }

    func send<Response: Decodable, Body: Encodable>(
        path: String,
        method: HTTPMethod,
        queryItems: [URLQueryItem] = [],
        body: Body? = nil,
        requiresAuth: Bool = true,
        allowAuthRecovery: Bool = true,
        responseType: Response.Type
    ) async throws -> Response {
        let request = try buildRequest(
            path: path,
            method: method,
            queryItems: queryItems,
            body: body,
            requiresAuth: requiresAuth
        )
        return try await execute(
            request: request,
            requiresAuth: requiresAuth,
            allowAuthRecovery: allowAuthRecovery,
            responseType: responseType
        )
    }

    func send<Response: Decodable>(
        path: String,
        method: HTTPMethod,
        queryItems: [URLQueryItem] = [],
        requiresAuth: Bool = true,
        allowAuthRecovery: Bool = true,
        responseType: Response.Type
    ) async throws -> Response {
        struct EmptyBody: Encodable {}
        let request = try buildRequest(
            path: path,
            method: method,
            queryItems: queryItems,
            body: Optional<EmptyBody>.none,
            requiresAuth: requiresAuth
        )
        return try await execute(
            request: request,
            requiresAuth: requiresAuth,
            allowAuthRecovery: allowAuthRecovery,
            responseType: responseType
        )
    }

    private func buildRequest<Body: Encodable>(
        path: String,
        method: HTTPMethod,
        queryItems: [URLQueryItem],
        body: Body?,
        requiresAuth: Bool,
    ) throws -> URLRequest {
        let normalizedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let url = environment.apiBaseURL.appendingPathComponent(normalizedPath)
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw APIClientError.invalidResponse
        }
        if queryItems.isEmpty == false {
            components.queryItems = queryItems
        }
        guard let resolvedURL = components.url else {
            throw APIClientError.invalidResponse
        }
        var request = URLRequest(url: resolvedURL)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
        request.setValue("ios", forHTTPHeaderField: "X-Client-Platform")
        request.setValue("kelmah-native", forHTTPHeaderField: "X-Client-App")

        if requiresAuth, let token = sessionStore.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        return request
    }

    private func execute<Response: Decodable>(
        request: URLRequest,
        requiresAuth: Bool,
        allowAuthRecovery: Bool,
        responseType: Response.Type,
    ) async throws -> Response {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        if httpResponse.statusCode == 401,
           requiresAuth,
           allowAuthRecovery,
           let authRecoveryHandler,
           await authRecoveryHandler() {
            var retriedRequest = request
            if let token = sessionStore.accessToken {
                retriedRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            return try await execute(
                request: retriedRequest,
                requiresAuth: requiresAuth,
                allowAuthRecovery: false,
                responseType: responseType
            )
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let message = decodeErrorMessage(from: data) ?? HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode)
            throw APIClientError.invalidStatusCode(httpResponse.statusCode, message)
        }
        return try decoder.decode(Response.self, from: data)
    }

    private func decodeErrorMessage(from data: Data) -> String? {
        guard data.isEmpty == false else { return nil }
        let envelope = try? decoder.decode(ErrorEnvelope.self, from: data)
        return envelope?.error?.message ?? envelope?.message
    }
}
