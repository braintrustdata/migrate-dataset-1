var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    if (!("__unenv__" in performance)) {
      const proto = Performance.prototype;
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key !== "constructor" && !(key in performance)) {
          const desc = Object.getOwnPropertyDescriptor(proto, key);
          if (desc) {
            Object.defineProperty(performance, key, desc);
          }
        }
      }
    }
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, unenvProcess, exit, features, platform, _channel, _debugEnd, _debugProcess, _disconnect, _events, _eventsCount, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _handleQueue, _kill, _linkedBinding, _maxListeners, _pendingMessage, _preload_modules, _rawDebug, _send, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, assert2, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, disconnect, dlopen, domain, emit, emitWarning, env, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, hrtime3, initgroups, kill, listenerCount, listeners, loadEnvFile, mainModule, memoryUsage, moduleLoadList, nextTick, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert2,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/router.js
var require_router = __commonJS({
  "src/router.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var Router2 = class {
      static {
        __name(this, "Router");
      }
      constructor() {
        this.routes = [];
      }
      get(pattern, handler) {
        this._add("GET", pattern, handler);
      }
      post(pattern, handler) {
        this._add("POST", pattern, handler);
      }
      put(pattern, handler) {
        this._add("PUT", pattern, handler);
      }
      delete(pattern, handler) {
        this._add("DELETE", pattern, handler);
      }
      _add(method, pattern, handler) {
        const paramNames = [];
        const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
          paramNames.push(name);
          return "([^/]+)";
        });
        this.routes.push({
          method,
          regex: new RegExp("^" + regexStr + "$"),
          paramNames,
          handler
        });
      }
      resolve(method, pathname) {
        for (const route of this.routes) {
          if (route.method !== method) continue;
          const match = pathname.match(route.regex);
          if (match) {
            const params = {};
            route.paramNames.forEach((name, i) => {
              params[name] = decodeURIComponent(match[i + 1]);
            });
            return { handler: route.handler, params };
          }
        }
        return null;
      }
    };
    module.exports = Router2;
  }
});

// src/store.js
var require_store = __commonJS({
  "src/store.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var Store2 = class {
      static {
        __name(this, "Store");
      }
      constructor() {
        this.cache = this._defaultData();
      }
      _defaultData() {
        return {
          emails: [],
          labels: [
            { id: "personal", name: "Personal", color: "#4285f4" },
            { id: "work", name: "Work", color: "#ea4335" },
            { id: "finance", name: "Finance", color: "#34a853" }
          ],
          contacts: [],
          attachments: {}
        };
      }
      async init() {
      }
      getEmails() {
        return this.cache.emails;
      }
      getLabels() {
        return this.cache.labels;
      }
      getContacts() {
        return this.cache.contacts;
      }
      getAttachment(id) {
        return this.cache.attachments[id] || null;
      }
      async addEmail(email) {
        this.cache.emails.unshift(email);
        return email;
      }
      async updateEmail(id, updates) {
        const email = this.cache.emails.find((e) => e.id === id);
        if (!email) return null;
        Object.assign(email, updates);
        return email;
      }
      async deleteEmail(id) {
        const idx = this.cache.emails.findIndex((e) => e.id === id);
        if (idx === -1) return false;
        this.cache.emails.splice(idx, 1);
        return true;
      }
      async addLabel(label) {
        this.cache.labels.push(label);
        return label;
      }
      async updateLabel(id, updates) {
        const label = this.cache.labels.find((l) => l.id === id);
        if (!label) return null;
        Object.assign(label, updates);
        return label;
      }
      async deleteLabel(id) {
        this.cache.labels = this.cache.labels.filter((l) => l.id !== id);
        for (const email of this.cache.emails) {
          email.labels = (email.labels || []).filter((l) => l !== id);
        }
        return true;
      }
      async addContact(contact) {
        this.cache.contacts.push(contact);
        return contact;
      }
      async deleteContact(id) {
        this.cache.contacts = this.cache.contacts.filter((c) => c.id !== id);
        return true;
      }
      async saveAttachment(id, base64Data) {
        this.cache.attachments[id] = base64Data;
      }
      async seedData(data) {
        if (data.emails) {
          for (const email of data.emails) {
            this.cache.emails.push(email);
          }
        }
        if (data.labels) {
          for (const label of data.labels) {
            this.cache.labels.push(label);
          }
        }
        if (data.contacts) {
          for (const contact of data.contacts) {
            this.cache.contacts.push(contact);
          }
        }
      }
      async reset() {
        this.cache = this._defaultData();
      }
      async persist() {
      }
      async close() {
      }
    };
    module.exports = Store2;
  }
});

// node-built-in-modules:crypto
import libDefault from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});

// src/lib/uuid.js
var require_uuid = __commonJS({
  "src/lib/uuid.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var crypto = require_crypto();
    module.exports = /* @__PURE__ */ __name(function uuid2() {
      if (crypto.randomUUID) return crypto.randomUUID();
      const bytes = crypto.randomBytes(16);
      bytes[6] = bytes[6] & 15 | 64;
      bytes[8] = bytes[8] & 63 | 128;
      const hex = bytes.toString("hex");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }, "uuid");
  }
});

// src/lib/parseBody.js
var require_parseBody = __commonJS({
  "src/lib/parseBody.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = /* @__PURE__ */ __name(function parseBody2(req) {
      return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          const buf = Buffer.concat(chunks);
          const ct = req.headers["content-type"] || "";
          if (ct.includes("application/json")) {
            try {
              resolve({ json: JSON.parse(buf.toString("utf8")) });
            } catch {
              reject(new Error("Invalid JSON"));
            }
          } else if (ct.includes("multipart/form-data")) {
            let boundary = ct.split("boundary=")[1];
            if (!boundary) return reject(new Error("No boundary in multipart"));
            boundary = boundary.replace(/"/g, "").split(";")[0].trim();
            resolve({ parts: parseMultipart(buf, boundary) });
          } else if (buf.length > 0) {
            try {
              resolve({ json: JSON.parse(buf.toString("utf8")) });
            } catch {
              resolve({ raw: buf });
            }
          } else {
            resolve({ json: {} });
          }
        });
        req.on("error", reject);
      });
    }, "parseBody");
    function parseMultipart(buf, boundary) {
      const delim = Buffer.from("--" + boundary);
      const parts = [];
      let pos = buf.indexOf(delim);
      if (pos === -1) return parts;
      pos += delim.length;
      if (buf[pos] === 13 && buf[pos + 1] === 10) pos += 2;
      while (true) {
        const nextDelim = buf.indexOf(delim, pos);
        if (nextDelim === -1) break;
        const partData = buf.slice(pos, nextDelim - 2);
        const sep = Buffer.from("\r\n\r\n");
        const sepIdx = partData.indexOf(sep);
        if (sepIdx === -1) break;
        const headerStr = partData.slice(0, sepIdx).toString("utf8");
        const body = partData.slice(sepIdx + 4);
        const headers = {};
        for (const line of headerStr.split("\r\n")) {
          const c = line.indexOf(":");
          if (c !== -1) {
            headers[line.substring(0, c).toLowerCase().trim()] = line.substring(c + 1).trim();
          }
        }
        const cd = headers["content-disposition"] || "";
        const nm = cd.match(/name="([^"]+)"/);
        const fn = cd.match(/filename="([^"]+)"/);
        parts.push({
          name: nm ? nm[1] : "",
          filename: fn ? fn[1] : null,
          type: headers["content-type"] || "application/octet-stream",
          data: body
        });
        pos = nextDelim + delim.length;
        if (pos < buf.length && buf[pos] === 45 && buf[pos + 1] === 45) break;
        if (buf[pos] === 13 && buf[pos + 1] === 10) pos += 2;
      }
      return parts;
    }
    __name(parseMultipart, "parseMultipart");
  }
});

// src/lib/search.js
var require_search = __commonJS({
  "src/lib/search.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = /* @__PURE__ */ __name(function search(emails, query) {
      const q = query.toLowerCase().trim();
      if (!q) return emails;
      const terms = [];
      let folder = null;
      let hasAttachment = false;
      let label = null;
      let from = null;
      let to = null;
      let isStarred = null;
      let isUnread = null;
      let subject = null;
      const parts = q.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      for (const part of parts) {
        if (part.startsWith("in:")) {
          folder = part.slice(3);
        } else if (part === "has:attachment") {
          hasAttachment = true;
        } else if (part.startsWith("label:")) {
          label = part.slice(6);
        } else if (part.startsWith("from:")) {
          from = part.slice(5).replace(/"/g, "");
        } else if (part.startsWith("to:")) {
          to = part.slice(3).replace(/"/g, "");
        } else if (part === "is:starred") {
          isStarred = true;
        } else if (part === "is:unread") {
          isUnread = true;
        } else if (part.startsWith("subject:")) {
          subject = part.slice(8).replace(/"/g, "");
        } else {
          terms.push(part.replace(/"/g, ""));
        }
      }
      return emails.filter((email) => {
        if (folder && email.folder !== folder) return false;
        if (hasAttachment && (!email.attachments || email.attachments.length === 0)) return false;
        if (from) {
          const f = email.from || {};
          if (!(f.address || "").toLowerCase().includes(from) && !(f.name || "").toLowerCase().includes(from)) return false;
        }
        if (to) {
          const toMatch = (email.to || []).some(
            (t) => t.address.toLowerCase().includes(to) || t.name.toLowerCase().includes(to)
          );
          if (!toMatch) return false;
        }
        if (isStarred !== null && email.starred !== isStarred) return false;
        if (isUnread !== null && email.read === isUnread) return false;
        if (subject && !(email.subject || "").toLowerCase().includes(subject)) return false;
        if (label) {
          const labelMatch = (email.labels || []).some((l) => l.toLowerCase() === label || l.toLowerCase().includes(label));
          if (!labelMatch) return false;
        }
        if (terms.length > 0) {
          const text = [
            email.subject || "",
            email.bodyText || email.body || "",
            (email.from || {}).name || "",
            (email.from || {}).address || "",
            ...(email.to || []).map((t) => (t.name || "") + " " + (t.address || ""))
          ].join(" ").toLowerCase();
          return terms.every((term) => text.includes(term));
        }
        return true;
      });
    }, "search");
  }
});

// src/config.js
var require_config = __commonJS({
  "src/config.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      port: parseInt(process.env.PORT, 10) || 3002,
      userEmail: "me@gmail-clone.local",
      userName: "Me"
    };
  }
});

// src/handlers/emailHandlers.js
var require_emailHandlers = __commonJS({
  "src/handlers/emailHandlers.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var uuid2 = require_uuid();
    var parseBody2 = require_parseBody();
    var search = require_search();
    var config2 = require_config();
    function sendJSON(res, status, data) {
      const body = JSON.stringify(data);
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
    }
    __name(sendJSON, "sendJSON");
    function paginate(items, page, limit) {
      const total = items.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      return {
        items: items.slice(start, start + limit),
        total,
        page,
        totalPages
      };
    }
    __name(paginate, "paginate");
    async function listEmails(req, res, store2, params, query) {
      let emails = store2.getEmails().slice();
      const folder = query.folder;
      const labelId = query.label;
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 50;
      if (folder === "starred") {
        emails = emails.filter((e) => e.starred && e.folder !== "trash" && e.folder !== "spam");
      } else if (folder === "all") {
        emails = emails.filter((e) => e.folder !== "trash" && e.folder !== "spam");
      } else if (folder) {
        emails = emails.filter((e) => e.folder === folder);
      }
      if (labelId) {
        emails = emails.filter((e) => (e.labels || []).includes(labelId));
      }
      emails.sort((a, b) => new Date(b.date) - new Date(a.date));
      const result = paginate(emails, page, limit);
      sendJSON(res, 200, {
        emails: result.items,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
    }
    __name(listEmails, "listEmails");
    async function getEmail(req, res, store2, params) {
      const email = store2.getEmails().find((e) => e.id === params.id);
      if (!email) return sendJSON(res, 404, { error: "Email not found" });
      const thread = store2.getEmails().filter((e) => e.threadId === email.threadId && e.id !== email.id).sort((a, b) => new Date(a.date) - new Date(b.date));
      sendJSON(res, 200, { email, thread });
    }
    __name(getEmail, "getEmail");
    async function createEmail(req, res, store2) {
      const { json } = await parseBody2(req);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const folder = json.folder || "sent";
      const email = {
        id: json.id || uuid2(),
        from: json.from || { name: config2.userName, address: config2.userEmail },
        to: json.to || [],
        cc: json.cc || [],
        bcc: json.bcc || [],
        subject: json.subject || "(no subject)",
        body: json.body || "",
        bodyText: json.bodyText || "",
        date: json.date || now,
        read: json.read !== void 0 ? json.read : folder === "sent" || folder === "drafts",
        starred: json.starred || false,
        folder,
        labels: json.labels || [],
        attachments: json.attachments || [],
        threadId: json.threadId || uuid2(),
        inReplyTo: json.inReplyTo || null
      };
      await store2.addEmail(email);
      if (folder === "sent") {
        const existing = new Set(store2.getContacts().map((c) => c.address));
        for (const r of [...email.to || [], ...email.cc || []]) {
          if (r.address && !existing.has(r.address)) {
            await store2.addContact({ id: uuid2(), name: r.name || "", address: r.address });
            existing.add(r.address);
          }
        }
      }
      sendJSON(res, 201, { email });
    }
    __name(createEmail, "createEmail");
    async function updateEmail(req, res, store2, params) {
      const { json } = await parseBody2(req);
      const allowed = ["read", "starred", "folder", "labels", "subject", "body", "bodyText", "to", "cc", "bcc", "attachments"];
      const updates = {};
      for (const key of allowed) {
        if (json[key] !== void 0) updates[key] = json[key];
      }
      const email = await store2.updateEmail(params.id, updates);
      if (!email) return sendJSON(res, 404, { error: "Email not found" });
      sendJSON(res, 200, { email });
    }
    __name(updateEmail, "updateEmail");
    async function deleteEmail(req, res, store2, params, query) {
      const email = store2.getEmails().find((e) => e.id === params.id);
      if (!email) return sendJSON(res, 404, { error: "Email not found" });
      if (query.permanent === "true" || email.folder === "trash") {
        await store2.deleteEmail(params.id);
      } else {
        await store2.updateEmail(params.id, { folder: "trash" });
      }
      sendJSON(res, 200, { success: true });
    }
    __name(deleteEmail, "deleteEmail");
    async function bulkAction(req, res, store2) {
      const { json } = await parseBody2(req);
      const { ids, action, labelId } = json;
      if (!ids || !Array.isArray(ids) || !action) {
        return sendJSON(res, 400, { error: "ids and action required" });
      }
      const idSet = new Set(ids);
      const emails = store2.getEmails();
      if (action === "delete") {
        store2.cache.emails = emails.filter((e) => !idSet.has(e.id));
      } else {
        for (const email of emails) {
          if (!idSet.has(email.id)) continue;
          switch (action) {
            case "read":
              email.read = true;
              break;
            case "unread":
              email.read = false;
              break;
            case "star":
              email.starred = true;
              break;
            case "unstar":
              email.starred = false;
              break;
            case "trash":
              email.folder = "trash";
              break;
            case "spam":
              email.folder = "spam";
              break;
            case "archive":
              email.folder = "archive";
              break;
            case "inbox":
              email.folder = "inbox";
              break;
            case "label":
              if (labelId && !(email.labels || []).includes(labelId)) {
                email.labels = [...email.labels || [], labelId];
              }
              break;
            case "unlabel":
              email.labels = (email.labels || []).filter((l) => l !== labelId);
              break;
          }
        }
      }
      await store2.persist();
      sendJSON(res, 200, { success: true });
    }
    __name(bulkAction, "bulkAction");
    async function replyEmail(req, res, store2, params) {
      const original = store2.getEmails().find((e) => e.id === params.id);
      if (!original) return sendJSON(res, 404, { error: "Email not found" });
      const { json } = await parseBody2(req);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let to;
      if (json.replyAll) {
        const seen = /* @__PURE__ */ new Set([config2.userEmail]);
        to = [];
        if (original.from && original.from.address && !seen.has(original.from.address)) {
          to.push(original.from);
          seen.add(original.from.address);
        }
        for (const r of [...original.to || [], ...original.cc || []]) {
          if (r.address && !seen.has(r.address)) {
            to.push(r);
            seen.add(r.address);
          }
        }
      } else {
        to = original.from ? [original.from] : [];
      }
      const reply = {
        id: uuid2(),
        from: { name: config2.userName, address: config2.userEmail },
        to,
        cc: [],
        bcc: [],
        subject: (original.subject || "").startsWith("Re:") ? original.subject : "Re: " + (original.subject || ""),
        body: json.body || "",
        bodyText: json.bodyText || "",
        date: now,
        read: true,
        starred: false,
        folder: "sent",
        labels: [],
        attachments: json.attachments || [],
        threadId: original.threadId,
        inReplyTo: original.id
      };
      await store2.addEmail(reply);
      sendJSON(res, 201, { email: reply });
    }
    __name(replyEmail, "replyEmail");
    async function forwardEmail(req, res, store2, params) {
      const original = store2.getEmails().find((e) => e.id === params.id);
      if (!original) return sendJSON(res, 404, { error: "Email not found" });
      const { json } = await parseBody2(req);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const fwd = {
        id: uuid2(),
        from: { name: config2.userName, address: config2.userEmail },
        to: json.to || [],
        cc: json.cc || [],
        bcc: [],
        subject: (original.subject || "").startsWith("Fwd:") ? original.subject : "Fwd: " + (original.subject || ""),
        body: json.body || "",
        bodyText: json.bodyText || "",
        date: now,
        read: true,
        starred: false,
        folder: "sent",
        labels: [],
        attachments: original.attachments || [],
        threadId: uuid2(),
        inReplyTo: null
      };
      await store2.addEmail(fwd);
      sendJSON(res, 201, { email: fwd });
    }
    __name(forwardEmail, "forwardEmail");
    async function searchEmails(req, res, store2, params, query) {
      const q = query.q || "";
      let emails = store2.getEmails().slice();
      emails = search(emails, q);
      emails.sort((a, b) => new Date(b.date) - new Date(a.date));
      sendJSON(res, 200, { emails });
    }
    __name(searchEmails, "searchEmails");
    async function getFolderCounts(req, res, store2) {
      const emails = store2.getEmails();
      const counts = { inbox: 0, starred: 0, sent: 0, drafts: 0, trash: 0, spam: 0, archive: 0 };
      for (const email of emails) {
        if (email.folder === "inbox" && !email.read) counts.inbox++;
        if (email.folder === "sent") counts.sent++;
        if (email.folder === "drafts") counts.drafts++;
        if (email.folder === "trash") counts.trash++;
        if (email.folder === "spam") counts.spam++;
        if (email.folder === "archive") counts.archive++;
        if (email.starred && email.folder !== "trash" && email.folder !== "spam") counts.starred++;
      }
      sendJSON(res, 200, counts);
    }
    __name(getFolderCounts, "getFolderCounts");
    module.exports = {
      listEmails,
      getEmail,
      createEmail,
      updateEmail,
      deleteEmail,
      bulkAction,
      replyEmail,
      forwardEmail,
      searchEmails,
      getFolderCounts
    };
  }
});

// src/handlers/labelHandlers.js
var require_labelHandlers = __commonJS({
  "src/handlers/labelHandlers.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var uuid2 = require_uuid();
    var parseBody2 = require_parseBody();
    function sendJSON(res, status, data) {
      const body = JSON.stringify(data);
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
    }
    __name(sendJSON, "sendJSON");
    async function listLabels(req, res, store2) {
      sendJSON(res, 200, { labels: store2.getLabels() });
    }
    __name(listLabels, "listLabels");
    async function createLabel(req, res, store2) {
      const { json } = await parseBody2(req);
      if (!json.name) return sendJSON(res, 400, { error: "name required" });
      const label = {
        id: json.id || uuid2(),
        name: json.name,
        color: json.color || "#999999"
      };
      await store2.addLabel(label);
      sendJSON(res, 201, { label });
    }
    __name(createLabel, "createLabel");
    async function updateLabel(req, res, store2, params) {
      const { json } = await parseBody2(req);
      const updates = {};
      if (json.name !== void 0) updates.name = json.name;
      if (json.color !== void 0) updates.color = json.color;
      const label = await store2.updateLabel(params.id, updates);
      if (!label) return sendJSON(res, 404, { error: "Label not found" });
      sendJSON(res, 200, { label });
    }
    __name(updateLabel, "updateLabel");
    async function deleteLabel(req, res, store2, params) {
      await store2.deleteLabel(params.id);
      sendJSON(res, 200, { success: true });
    }
    __name(deleteLabel, "deleteLabel");
    module.exports = { listLabels, createLabel, updateLabel, deleteLabel };
  }
});

// src/handlers/contactHandlers.js
var require_contactHandlers = __commonJS({
  "src/handlers/contactHandlers.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var uuid2 = require_uuid();
    var parseBody2 = require_parseBody();
    function sendJSON(res, status, data) {
      const body = JSON.stringify(data);
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
    }
    __name(sendJSON, "sendJSON");
    async function listContacts(req, res, store2, params, query) {
      let contacts = store2.getContacts();
      if (query.q) {
        const q = query.q.toLowerCase();
        contacts = contacts.filter(
          (c) => (c.name || "").toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q)
        );
      }
      sendJSON(res, 200, { contacts });
    }
    __name(listContacts, "listContacts");
    async function createContact(req, res, store2) {
      const { json } = await parseBody2(req);
      if (!json.address) return sendJSON(res, 400, { error: "address required" });
      const contact = {
        id: json.id || uuid2(),
        name: json.name || "",
        address: json.address
      };
      await store2.addContact(contact);
      sendJSON(res, 201, { contact });
    }
    __name(createContact, "createContact");
    async function deleteContact(req, res, store2, params) {
      await store2.deleteContact(params.id);
      sendJSON(res, 200, { success: true });
    }
    __name(deleteContact, "deleteContact");
    module.exports = { listContacts, createContact, deleteContact };
  }
});

// src/handlers/attachmentHandlers.js
var require_attachmentHandlers = __commonJS({
  "src/handlers/attachmentHandlers.js"(exports, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var uuid2 = require_uuid();
    var parseBody2 = require_parseBody();
    function sendJSON(res, status, data) {
      const body = JSON.stringify(data);
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
    }
    __name(sendJSON, "sendJSON");
    async function uploadAttachment(req, res, store2) {
      const { parts } = await parseBody2(req);
      if (!parts || parts.length === 0) {
        return sendJSON(res, 400, { error: "No file uploaded" });
      }
      const file = parts[0];
      const id = uuid2();
      await store2.saveAttachment(id, file.data.toString("base64"));
      sendJSON(res, 201, {
        attachment: {
          id,
          name: file.filename || "file",
          type: file.type,
          size: file.data.length
        }
      });
    }
    __name(uploadAttachment, "uploadAttachment");
    async function downloadAttachment(req, res, store2, params) {
      const data = store2.getAttachment(params.id);
      if (!data) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Attachment not found" }));
      }
      const buf = Buffer.from(data, "base64");
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": buf.length
      });
      res.end(buf);
    }
    __name(downloadAttachment, "downloadAttachment");
    module.exports = { uploadAttachment, downloadAttachment };
  }
});

// .wrangler/tmp/bundle-sxtT2N/middleware-loader.entry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// .wrangler/tmp/bundle-sxtT2N/middleware-insertion-facade.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// worker/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var Router = require_router();
var Store = require_store();
var emailHandlers = require_emailHandlers();
var labelHandlers = require_labelHandlers();
var contactHandlers = require_contactHandlers();
var attachmentHandlers = require_attachmentHandlers();
var parseBody = require_parseBody();
var uuid = require_uuid();
var store = new Store();
var NodeRequest = class {
  static {
    __name(this, "NodeRequest");
  }
  constructor(headers, body) {
    this.headers = headers;
    this._body = body;
  }
  on(event, cb) {
    if (event === "data") {
      if (this._body && this._body.length > 0) cb(this._body);
    } else if (event === "end") {
      cb();
    }
  }
};
var NodeResponse = class {
  static {
    __name(this, "NodeResponse");
  }
  constructor() {
    this.statusCode = 200;
    this._headers = {};
    this.headersSent = false;
    this._body = null;
    this._resolve = null;
    this.promise = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }
  setHeader(name, value) {
    this._headers[name] = String(value);
  }
  writeHead(status, headers) {
    this.statusCode = status;
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        this._headers[key] = String(value);
      }
    }
    this.headersSent = true;
  }
  end(body) {
    this._body = body != null ? body : null;
    this._resolve();
  }
  on() {
  }
  // no-op for 'finish' etc.
  toResponse(extraHeaders) {
    const headers = { ...extraHeaders, ...this._headers };
    return new Response(this._body, {
      status: this.statusCode,
      headers
    });
  }
};
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var router = new Router();
router.get("/api/emails", (req, res, params, query) => emailHandlers.listEmails(req, res, store, params, query));
router.post("/api/emails/bulk", (req, res) => emailHandlers.bulkAction(req, res, store));
router.post("/api/emails", (req, res) => emailHandlers.createEmail(req, res, store));
router.post("/api/emails/:id/reply", (req, res, params) => emailHandlers.replyEmail(req, res, store, params));
router.post("/api/emails/:id/forward", (req, res, params) => emailHandlers.forwardEmail(req, res, store, params));
router.get("/api/emails/:id", (req, res, params) => emailHandlers.getEmail(req, res, store, params));
router.put("/api/emails/:id", (req, res, params) => emailHandlers.updateEmail(req, res, store, params));
router.delete("/api/emails/:id", (req, res, params, query) => emailHandlers.deleteEmail(req, res, store, params, query));
router.get("/api/search", (req, res, params, query) => emailHandlers.searchEmails(req, res, store, params, query));
router.get("/api/folders/counts", (req, res) => emailHandlers.getFolderCounts(req, res, store));
router.get("/api/labels", (req, res) => labelHandlers.listLabels(req, res, store));
router.post("/api/labels", (req, res) => labelHandlers.createLabel(req, res, store));
router.put("/api/labels/:id", (req, res, params) => labelHandlers.updateLabel(req, res, store, params));
router.delete("/api/labels/:id", (req, res, params) => labelHandlers.deleteLabel(req, res, store, params));
router.get("/api/contacts", (req, res, params, query) => contactHandlers.listContacts(req, res, store, params, query));
router.post("/api/contacts", (req, res) => contactHandlers.createContact(req, res, store));
router.delete("/api/contacts/:id", (req, res, params) => contactHandlers.deleteContact(req, res, store, params));
router.post("/api/attachments", (req, res) => attachmentHandlers.uploadAttachment(req, res, store));
router.get("/api/attachments/:id", (req, res, params) => attachmentHandlers.downloadAttachment(req, res, store, params));
router.post("/api/seed", async (req, res) => {
  const { json } = await parseBody(req);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const seedEmails = (json.emails || []).map((e) => ({
    id: e.id || uuid(),
    from: e.from || { name: "Unknown", address: "unknown@example.com" },
    to: e.to || [],
    cc: e.cc || [],
    bcc: e.bcc || [],
    subject: e.subject || "(no subject)",
    body: e.body || "",
    bodyText: e.bodyText || "",
    date: e.date || now,
    read: e.read !== void 0 ? e.read : false,
    starred: e.starred !== void 0 ? e.starred : false,
    folder: e.folder || "inbox",
    labels: e.labels || [],
    attachments: e.attachments || [],
    threadId: e.threadId || uuid(),
    inReplyTo: e.inReplyTo || null
  }));
  await store.seedData({
    emails: seedEmails,
    labels: json.labels || [],
    contacts: json.contacts || []
  });
  const body = JSON.stringify({ success: true });
  res.writeHead(200, { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(body)) });
  res.end(body);
});
router.post("/api/reset", async (req, res) => {
  await store.reset();
  const body = JSON.stringify({ success: true });
  res.writeHead(200, { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(body)) });
  res.end(body);
});
var worker_default = {
  async fetch(request, env2) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      const url = new URL(request.url);
      const pathname = url.pathname;
      const query = Object.fromEntries(url.searchParams.entries());
      const match = router.resolve(request.method, pathname);
      if (match) {
        const headers = {};
        for (const [key, value] of request.headers.entries()) {
          headers[key] = value;
        }
        const bodyBuf = Buffer.from(await request.arrayBuffer());
        const req = new NodeRequest(headers, bodyBuf);
        const res = new NodeResponse();
        await match.handler(req, res, match.params, query);
        await res.promise;
        return res.toResponse(corsHeaders);
      }
      if (request.method === "GET") {
        return env2.ASSETS.fetch(request);
      }
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Request error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-sxtT2N/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sxtT2N/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
