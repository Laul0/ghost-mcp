#!/usr/bin/env node

import { createServer } from "node:http";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ghostApiClient } from './ghostApi'; // Import the initialized Ghost API client
import {
    handleUserResource,
    handleMemberResource,
    handleTierResource,
    handleOfferResource,
    handleNewsletterResource,
    handlePostResource,
    handleBlogInfoResource
} from './resources'; // Import resource handlers

// Create an MCP server instance
const server = new McpServer({
    name: "ghost-mcp-ts",
    version: "1.0.0", // TODO: Get version from package.json
}, {
    capabilities: {
        resources: {}, // Capabilities will be enabled as handlers are registered
        tools: {},
        prompts: {},
        logging: {} // Enable logging capability
    }
});

// Register resource handlers
server.resource("user", new ResourceTemplate("user://{user_id}", { list: undefined }), handleUserResource);
server.resource("member", new ResourceTemplate("member://{member_id}", { list: undefined }), handleMemberResource);
server.resource("tier", new ResourceTemplate("tier://{tier_id}", { list: undefined }), handleTierResource);
server.resource("offer", new ResourceTemplate("offer://{offer_id}", { list: undefined }), handleOfferResource);
server.resource("newsletter", new ResourceTemplate("newsletter://{newsletter_id}", { list: undefined }), handleNewsletterResource);
server.resource("post", new ResourceTemplate("post://{post_id}", { list: undefined }), handlePostResource);
server.resource("blog-info", "blog://info", handleBlogInfoResource);

// Register tools
import { registerPostTools } from "./tools/posts";
import { registerMemberTools } from "./tools/members";
registerPostTools(server);
registerMemberTools(server);
import { registerUserTools } from "./tools/users";
registerUserTools(server);
import { registerTagTools } from "./tools/tags";
registerTagTools(server);
import { registerTierTools } from "./tools/tiers";
registerTierTools(server);
import { registerOfferTools } from "./tools/offers";
registerOfferTools(server);
import { registerNewsletterTools } from "./tools/newsletters";
registerNewsletterTools(server);
import { registerInviteTools } from "./tools/invites";
registerInviteTools(server);

import { registerRoleTools } from "./tools/roles";
registerRoleTools(server);
import { registerWebhookTools } from "./tools/webhooks";
registerWebhookTools(server);

import { registerPrompts } from "./prompts";
registerPrompts(server);

function getTransportMode(): 'stdio' | 'http' {
    const transport = (process.env.MCP_TRANSPORT || 'http').toLowerCase();
    return transport === 'stdio' ? 'stdio' : 'http';
}

async function startStdioServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Ghost MCP TypeScript Server running on stdio");
}

async function startHttpServer() {
    const host = process.env.MCP_HOST || '0.0.0.0';
    const port = Number(process.env.MCP_PORT || '3000');
    const path = process.env.MCP_HTTP_PATH || '/';

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    await server.connect(transport);

    const httpServer = createServer(async (req, res) => {
        try {
            const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

            if (url.pathname === '/health') {
                res.writeHead(200, { 'content-type': 'text/plain' });
                res.end('ok');
                return;
            }

            if (url.pathname !== path) {
                res.writeHead(404, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not Found' }));
                return;
            }

            let parsedBody: unknown;
            if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                const body = Buffer.concat(chunks).toString('utf-8');
                if (body) {
                    try {
                        parsedBody = JSON.parse(body);
                    } catch {
                        res.writeHead(400, { 'content-type': 'application/json' });
                        res.end(JSON.stringify({
                            jsonrpc: '2.0',
                            error: { code: -32700, message: 'Parse error: Invalid JSON' },
                            id: null,
                        }));
                        return;
                    }
                }
            }

            await transport.handleRequest(req, res, parsedBody);
        } catch (error) {
            console.error('Error handling HTTP MCP request:', error);
            if (!res.headersSent) {
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32603, message: 'Internal server error' },
                    id: null,
                }));
            }
        }
    });

    httpServer.listen(port, host, () => {
        console.error(`Ghost MCP TypeScript Server running on http://${host}:${port}${path}`);
    });

    process.on('SIGINT', async () => {
        await transport.close();
        await server.close();
        httpServer.close(() => process.exit(0));
    });
}

async function startServer() {
    if (getTransportMode() === 'stdio') {
        await startStdioServer();
        return;
    }
    await startHttpServer();
}

// Start the server
startServer().catch((error: any) => { // Add type annotation for error
    console.error("Fatal error starting server:", error);
    process.exit(1);
});