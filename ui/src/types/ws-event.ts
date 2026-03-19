export interface WsEvent {
  event: string;
  description: string;
  payload: Record<string, string>;
  response: string;
  auth: "none" | "bearer";
  handlerName: string;
  gatewayName: string;
}

export interface WsEventsResponse {
  title: string;
  events: WsEvent[];
}
