import { Injectable } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import {
  WSGATE_EVENT_METADATA,
  WsDocOptions,
} from "./decorators/ws-doc.decorator";

/**
 * Represents the full metadata of a discovered WebSocket event,
 * extended with the handler and gateway class names for UI rendering.
 */
export interface WsEventMeta extends WsDocOptions {
  /** The name of the method that handles this event (e.g. `handleMessage`). */
  handlerName: string;

  /** The name of the gateway class this event belongs to (e.g. `ChatGateway`). */
  gatewayName: string;
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
          events.push({
            ...meta,
            handlerName: methodName,
            gatewayName: instance.constructor.name,
          });
        }
      }
    }

    return events;
  }
}
