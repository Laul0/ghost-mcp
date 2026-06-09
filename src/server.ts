#!/usr/bin/env node

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { runWithGhostRequestContext } from "./requestContext";
import {
    handleUserResource,
    handleMemberResource,
    handleTierResource,
    handleOfferResource,
    handleNewsletterResource,
    handlePostResource,
    handleBlogInfoResource
} from './resources'; // Import resource handlers

import { registerPostTools } from "./tools/posts";
import { registerMemberTools } from "./tools/members";
import { registerUserTools } from "./tools/users";
import { registerTagTools } from "./tools/tags";
import { registerTierTools } from "./tools/tiers";
import { registerOfferTools } from "./tools/offers";
import { registerNewsletterTools } from "./tools/newsletters";
import { registerInviteTools } from "./tools/invites";
import { registerRoleTools } from "./tools/roles";
import { registerWebhookTools } from "./tools/webhooks";
import { registerPrompts } from "./prompts";

function getServerVersion(): string {
    try {
        const packageJsonPath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };
        if (typeof packageJson.version === 'string' && packageJson.version.trim().length > 0) {
            return packageJson.version;
        }
    } catch {
        // Fall back to a static version if package metadata is not available.
    }

    return '1.0.0';
}

function createConfiguredServer(): McpServer {
    const server = new McpServer({
        name: "ghost-mcp-ts",
        version: getServerVersion(),
    }, {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
            logging: {}
        }
    });

    server.resource("user", new ResourceTemplate("user://{user_id}", { list: undefined }), handleUserResource);
    server.resource("member", new ResourceTemplate("member://{member_id}", { list: undefined }), handleMemberResource);
    server.resource("tier", new ResourceTemplate("tier://{tier_id}", { list: undefined }), handleTierResource);
    server.resource("offer", new ResourceTemplate("offer://{offer_id}", { list: undefined }), handleOfferResource);
    server.resource("newsletter", new ResourceTemplate("newsletter://{newsletter_id}", { list: undefined }), handleNewsletterResource);
    server.resource("post", new ResourceTemplate("post://{post_id}", { list: undefined }), handlePostResource);
    server.resource("blog-info", "blog://info", handleBlogInfoResource);

    registerPostTools(server);
    registerMemberTools(server);
    registerUserTools(server);
    registerTagTools(server);
    registerTierTools(server);
    registerOfferTools(server);
    registerNewsletterTools(server);
    registerInviteTools(server);
    registerRoleTools(server);
    registerWebhookTools(server);
    registerPrompts(server);

    return server;
}

function getTransportMode(): 'stdio' | 'http' {
    const transport = (process.env.MCP_TRANSPORT || 'http').toLowerCase();
    return transport === 'stdio' ? 'stdio' : 'http';
}

async function startStdioServer() {
    const server = createConfiguredServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Ghost MCP TypeScript Server v${getServerVersion()} running on stdio`);
}

async function startHttpServer() {
    const host = process.env.MCP_HOST || '0.0.0.0';
    const port = Number(process.env.MCP_PORT || '3000');
    const path = process.env.MCP_HTTP_PATH || '/';

    type SessionRuntime = {
        server: McpServer;
        transport: StreamableHTTPServerTransport;
    };

    const sessions = new Map<string, SessionRuntime>();

    function logHttpEvent(message: string, details?: Record<string, unknown>) {
        if (!details || Object.keys(details).length === 0) {
            console.error(`[http] ${message}`);
            return;
        }
        console.error(`[http] ${message} ${JSON.stringify(details)}`);
    }

    function getHeaderValue(req: import("node:http").IncomingMessage, name: string): string | undefined {
        const raw = req.headers[name.toLowerCase()];
        if (Array.isArray(raw)) {
            return raw[0]?.trim() || undefined;
        }
        const value = raw?.trim();
        return value || undefined;
    }

    function getBearerToken(req: import("node:http").IncomingMessage): string | undefined {
        const auth = getHeaderValue(req, 'authorization');
        if (!auth) {
            return undefined;
        }

        const match = auth.match(/^Bearer\s+(.+)$/i);
        return match?.[1]?.trim() || undefined;
    }

    function isInitializePayload(payload: unknown): boolean {
        if (!payload) {
            return false;
        }

        if (Array.isArray(payload)) {
            return payload.some((entry) => {
                if (!entry || typeof entry !== 'object') {
                    return false;
                }
                const maybeMethod = (entry as { method?: unknown }).method;
                return maybeMethod === 'initialize';
            });
        }

        if (typeof payload !== 'object') {
            return false;
        }

        return (payload as { method?: unknown }).method === 'initialize';
    }

    const httpServer = createServer(async (req, res) => {
        const startedAt = Date.now();
        const requestPath = req.url || '/';
        const requestMethod = req.method || 'UNKNOWN';
        const requestSessionId = getHeaderValue(req, 'mcp-session-id');

        res.on('finish', () => {
            const durationMs = Date.now() - startedAt;
            logHttpEvent('response', {
                method: requestMethod,
                path: requestPath,
                sessionId: requestSessionId || null,
                statusCode: res.statusCode,
                durationMs,
            });
        });

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

            const jsonRpcMethods = (() => {
                if (!parsedBody) {
                    return [] as string[];
                }
                if (Array.isArray(parsedBody)) {
                    return parsedBody
                        .map((entry) => (typeof entry === 'object' && entry ? (entry as { method?: unknown }).method : undefined))
                        .filter((value): value is string => typeof value === 'string');
                }
                if (typeof parsedBody === 'object' && parsedBody) {
                    const method = (parsedBody as { method?: unknown }).method;
                    return typeof method === 'string' ? [method] : [];
                }
                return [] as string[];
            })();

            logHttpEvent('request', {
                method: req.method || 'UNKNOWN',
                path: url.pathname,
                sessionId: requestSessionId || null,
                jsonRpcMethods,
            });

            const sessionId = getHeaderValue(req, 'mcp-session-id');
            let runtime: SessionRuntime | undefined;

            if (req.method === 'POST') {
                if (sessionId && sessions.has(sessionId)) {
                    runtime = sessions.get(sessionId);
                } else if (!sessionId && isInitializePayload(parsedBody)) {
                    const newServer = createConfiguredServer();
                    const newTransport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        onsessioninitialized: (newSessionId) => {
                            sessions.set(newSessionId, {
                                server: newServer,
                                transport: newTransport,
                            });
                            logHttpEvent('session_initialized', {
                                sessionId: newSessionId,
                                activeSessions: sessions.size,
                            });
                        },
                    });

                    newTransport.onclose = async () => {
                        if (newTransport.sessionId) {
                            sessions.delete(newTransport.sessionId);
                            logHttpEvent('session_closed', {
                                sessionId: newTransport.sessionId,
                                activeSessions: sessions.size,
                            });
                        }
                        await newServer.close();
                    };

                    await newServer.connect(newTransport);
                    runtime = {
                        server: newServer,
                        transport: newTransport,
                    };
                } else {
                    res.writeHead(400, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
                        id: null,
                    }));
                    return;
                }
            } else {
                if (!sessionId || !sessions.has(sessionId)) {
                    res.writeHead(400, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        error: { code: -32000, message: 'Bad Request: Invalid or missing session ID' },
                        id: null,
                    }));
                    return;
                }
                runtime = sessions.get(sessionId);
            }

            if (!runtime) {
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32603, message: 'Internal server error: transport unavailable' },
                    id: null,
                }));
                return;
            }

            const requestContext = {
                // Prefer explicit custom header, then standard Authorization Bearer.
                adminApiKey: getHeaderValue(req, 'x-ghost-admin-api-key') || getBearerToken(req),
                apiVersion: getHeaderValue(req, 'x-ghost-api-version'),
            };

            await runWithGhostRequestContext(requestContext, async () => {
                await runtime!.transport.handleRequest(req, res, parsedBody);
            });
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
        console.error(`Ghost MCP TypeScript Server v${getServerVersion()} running on http://${host}:${port}${path}`);
    });

    process.on('SIGINT', async () => {
        for (const runtime of sessions.values()) {
            await runtime.transport.close();
        }
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