import type { AppLoadContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';
import { detectRuntime } from '~/lib/runtime';
import { PassThrough } from 'stream';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  const runtime = detectRuntime();
  const isCloudflareRuntime = runtime.type === 'cloudflare';

  if (isCloudflareRuntime) {
    return handleCloudflareRequest(request, responseStatusCode, responseHeaders, remixContext);
  } else {
    return handleNodeRequest(request, responseStatusCode, responseHeaders, remixContext);
  }
}

async function handleCloudflareRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
): Promise<Response> {
  const { renderToReadableStream } = await import('react-dom/server');

  const readable = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
    signal: request.signal,
    onError(error: unknown) {
      console.error(error);
      responseStatusCode = 500;
    },
  });

  const body = new ReadableStream({
    start(controller) {
      const head = renderHeadToString({ request, remixContext, Head });

      controller.enqueue(
        new Uint8Array(
          new TextEncoder().encode(
            `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`,
          ),
        ),
      );

      const reader = readable.getReader();

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
              controller.close();

              return;
            }

            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            controller.error(error);
            readable.cancel();
          });
      }
      read();
    },

    cancel() {
      readable.cancel();
    },
  });

  if (isbot(request.headers.get('user-agent') || '')) {
    await readable.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

function handleNodeRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const head = renderHeadToString({ request, remixContext, Head });
    const bodyPrefix = `<!DOCTYPE html><html lang="en" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`;
    const bodySuffix = '</div></body></html>';

    const { pipe, abort } = renderToPipeableStream(<RemixServer context={remixContext} url={request.url} />, {
      [isbot(request.headers.get('user-agent') || '') ? 'onAllReady' : 'onShellReady']() {
        shellRendered = true;

        const passthrough = new PassThrough();
        const stream = createReadableStreamFromStream(passthrough);

        responseHeaders.set('Content-Type', 'text/html');

        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );

        passthrough.write(bodyPrefix);
        pipe(passthrough);
        passthrough.write(bodySuffix);
        passthrough.end();
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;

        if (shellRendered) {
          console.error(error);
        }
      },
    });

    setTimeout(abort, 10000);
  });
}

function createReadableStreamFromStream(readable: PassThrough): ReadableStream {
  return new ReadableStream({
    start(controller) {
      readable.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      readable.on('end', () => {
        controller.close();
      });
      readable.on('error', (err: Error) => {
        controller.error(err);
      });
    },
    cancel() {
      readable.destroy();
    },
  });
}
