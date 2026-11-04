const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { test } = require('node:test');
const WebSocket = require('ws');
const { MAX_NAME_LENGTH } = require('./dist/shared/sharedTypes.js');

test('rejects invalid messages without changing state, then accepts a valid name', { timeout: 10000 }, async (t) => {
  const server = spawn(process.execPath, ['dist/server/index.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  t.after(async () => {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  });

  let output = '';
  let port;
  for await (const chunk of server.stdout) {
    output += chunk.toString();
    const match = output.match(/listening on port (\d+)/);
    if (match) {
      port = match[1];
      break;
    }
  }
  assert.ok(port, 'server started');

  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  t.after(() => socket.terminate());
  const messages = [];
  let wake;
  socket.on('message', (data) => {
    messages.push(JSON.parse(data.toString()));
    wake?.();
  });
  async function nextMessage() {
    if (!messages.length) await new Promise((resolve) => { wake = resolve; });
    wake = undefined;
    return messages.shift();
  }

  assert.equal((await nextMessage()).type, 'CONNECTION_SUCCESSFUL');
  assert.deepEqual(await nextMessage(), {
    type: 'PLAYERS_UPDATED', data: { players: [{}] },
  });

  const invalidMessages = [
    ['{', 'INVALID_JSON'],
    ['null', 'INVALID_MESSAGE'],
    ['{}', 'INVALID_MESSAGE'],
    [JSON.stringify({ type: 'UNKNOWN', data: {} }), 'INVALID_MESSAGE'],
    [JSON.stringify({ type: 'SET_NAME' }), 'INVALID_MESSAGE'],
    ...[null, 42, {}, '', '   ', 'a'.repeat(MAX_NAME_LENGTH + 1)].map((name) => [
      JSON.stringify({ type: 'SET_NAME', data: { name } }), 'INVALID_MESSAGE',
    ]),
  ];
  for (const [message, code] of invalidMessages) {
    socket.send(message);
    const response = await nextMessage();
    assert.equal(response.type, 'ERROR');
    assert.equal(response.data.code, code);
    assert.equal(typeof response.data.message, 'string');
    if (code === 'INVALID_MESSAGE') {
      assert.equal(response.data.message, 'Invalid client message.');
      assert.ok(response.data.issues.length > 0);
      for (const issue of response.data.issues) {
        assert.deepEqual(Object.keys(issue).sort(), ['message', 'path']);
        assert.equal(typeof issue.path, 'string');
        assert.equal(typeof issue.message, 'string');
      }
      if (JSON.parse(message)?.data?.name !== undefined) {
        assert.equal(response.data.issues[0].path, 'data.name');
      }
    }
    assert.equal(socket.readyState, WebSocket.OPEN);
  }

  for (const name of ['  Alice  ', 'a'.repeat(MAX_NAME_LENGTH)]) {
    socket.send(JSON.stringify({ type: 'SET_NAME', data: { name } }));
    assert.deepEqual(await nextMessage(), {
      type: 'USER_UPDATED', data: { userState: { name: name.trim() } },
    });
    assert.deepEqual(await nextMessage(), {
      type: 'PLAYERS_UPDATED', data: { players: [{ name: name.trim() }] },
    });
  }
});
