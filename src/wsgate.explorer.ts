import { Injectable } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import {
  WSGATE_EVENT_METADATA,
  WsDocOptions,
} from "./decorators/ws-doc.decorator";

// NestJS stores @WebSocketGateway() options under this reflect metadata key.
// Sourced from @nestjs/websockets/constants → GATEWAY_OPTIONS = 'websockets:gateway_options'.
// Used to auto-detect the namespace without requiring the user to repeat it in every @WsDoc() call.
const NESTJS_GATEWAY_OPTIONS_KEY = "websockets:gateway_options";

/**
 * Represents the full metadata of a discovered WebSocket event,
 * extended with the handler and gateway class names for UI rendering.
 *
 * Inherits all fields from `WsDocOptions` including `type`.
 */
export interface WsEventMeta extends WsDocOptions {
  /** The name of the method that handles this event (e.g. `handleMessage`). */
  handlerName: string;

  /** The name of the gateway class this event belongs to (e.g. `ChatGateway`). */
  gatewayName: string;

  /**
   * The resolved Socket.IO namespace for this event (e.g. `'/chat'`).
   *
   * Resolution order (first match wins):
   * 1. Explicit `namespace` in `@WsDoc()` options
   * 2. `namespace` from `@WebSocketGateway({ namespace })` on the class
   * 3. Default Socket.IO namespace: `'/'`
   *
   * Always starts with `'/'`.
   */
  namespace: string;
}

/** @internal Normalises a raw namespace value — ensures it starts with `/`. */
function normaliseNamespace(raw: string | undefined): string {
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/**
 * @internal
 * Reads the namespace from a `@WebSocketGateway()` class decorator, if present.
 * Degrades gracefully to `'/'` if the key is absent or the metadata is unavailable.
 */
function resolveGatewayNamespace(constructor: Function): string {
  try {
    const opts: { namespace?: string } | undefined = Reflect.getMetadata(
      NESTJS_GATEWAY_OPTIONS_KEY,
      constructor,
    );
    return normaliseNamespace(opts?.namespace);
  } catch {
    return "/";
  }
}

/**
 * WsgateExplorer scans all NestJS providers at bootstrap and collects
 * metadata from methods decorated with `@WsDoc()`.
 *
 * It uses NestJS's `DiscoveryService` to iterate over all registered
 * providers, `MetadataScanner` to iterate over their methods, and
 * `Reflector` to read the `@WsDoc()` metadata from each method.
 *
 * The collected metadata is later used by the wsgate UI to render
 * interactive documentation for all WebSocket gateway events.
 *
 * @example
 * // Automatically used by WsgateModule — no manual setup needed.
 * await WsgateModule.setup('/wsgate', app);
 */
@Injectable()
export class WsgateExplorer {
  constructor(
    /** Provides access to all registered NestJS providers at runtime. */
    private readonly discovery: DiscoveryService,

    /** Scans all method names from a class prototype. */
    private readonly metadataScanner: MetadataScanner,

    /** Reads decorator metadata from class methods. */
    private readonly reflector: Reflector,
  ) {}

  /**
   * Iterates over all registered NestJS providers and collects
   * metadata from methods decorated with `@WsDoc()`.
   *
   * @returns An array of `WsEventMeta` objects, one per decorated method.
   *
   * @example
   * const events = this.explorer.explore();
   * // [{ event: 'sendMessage', gatewayName: 'ChatGateway', ... }]
   */
  explore(): WsEventMeta[] {
    const events: WsEventMeta[] = [];

    // Retrieve all registered providers from the NestJS DI container
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;

      // Skip providers with no instance or no prototype (e.g. value providers)
      if (!instance || !Object.getPrototypeOf(instance)) continue;

      const prototype = Object.getPrototypeOf(instance);

      // Resolve namespace once per class from @WebSocketGateway({ namespace })
      const classNamespace = resolveGatewayNamespace(instance.constructor);

      // Get all method names from the provider's prototype
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        // Attempt to read @WsDoc() metadata from this method
        const meta = this.reflector.get<WsDocOptions>(
          WSGATE_EVENT_METADATA,
          instance[methodName],
        );

        // Only include methods that have @WsDoc() applied
        if (meta) {
          // Namespace is always resolved from @WebSocketGateway({ namespace }) on the class.
          // Fallback: '/' (the default Socket.IO namespace)
          events.push({
            ...meta,
            namespace: classNamespace,
            handlerName: methodName,
            gatewayName: instance.constructor.name,
          });
        }
      }
    }

    return events;
  }
}
