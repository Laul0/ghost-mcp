import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ElicitRequest, ElicitRequestSchema, ElicitResult } from "@modelcontextprotocol/sdk/types.js";

// Wires a real McpServer/Client pair over an in-memory transport so tool
// registration, zod validation, and handler behavior can be exercised end-to-end.
export async function createConnectedClient(
    register: (server: McpServer) => void,
    confirm?: (request: ElicitRequest) => Promise<ElicitResult>,
) {
    const server = new McpServer({ name: "test-server", version: "0.0.0" });
    register(server);

    const client = new Client(
        { name: "test-client", version: "0.0.0" },
        { capabilities: confirm ? { elicitation: {} } : {} },
    );
    if (confirm) {
        client.setRequestHandler(ElicitRequestSchema, confirm);
    }
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);

    return { client, server };
}
