/** map-dyoa-server HTTP 실패 시 클라이언트에서 추적용으로 던지는 오류 */

export type MapDyoaServerErrorBody = Record<string, unknown>;

export class MapDyoaServerRequestFailedError extends Error {
  readonly status: number;

  readonly requestId: string | null;

  readonly url: string;

  readonly body: MapDyoaServerErrorBody;

  /** 응답 JSON의 `error` 문자열 또는 `error.code` */
  readonly serverErrorCode: string | undefined;

  constructor(parts: {
    message: string;
    status: number;
    requestId: string | null;
    url: string;
    body: MapDyoaServerErrorBody;
    serverErrorCode?: string;
  }) {
    super(parts.message);
    this.name = "MapDyoaServerRequestFailedError";
    this.status = parts.status;
    this.requestId = parts.requestId;
    this.url = parts.url;
    this.body = parts.body;
    this.serverErrorCode = parts.serverErrorCode;
  }
}
