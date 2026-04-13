"""
内存日志采集器 — 用于 debug 面板实时查看后端日志。

使用 deque 环形缓冲区存储最近 N 条日志，零外部依赖。
在 create_app() 中挂载到 root logger 即可自动收集所有业务 + 框架日志。
"""

import logging
import threading
from collections import deque
from datetime import datetime, timezone


class LogRecord:
    __slots__ = ('timestamp', 'level', 'logger_name', 'message', 'pathname', 'lineno')

    def __init__(self, record: logging.LogRecord):
        self.timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        self.level = record.levelname
        self.logger_name = record.name
        self.message = record.getMessage()
        self.pathname = record.pathname
        self.lineno = record.lineno

    def to_dict(self) -> dict:
        return {
            'timestamp': self.timestamp,
            'level': self.level,
            'logger': self.logger_name,
            'message': self.message,
            'file': self.pathname,
            'line': self.lineno,
        }


class InMemoryLogHandler(logging.Handler):
    """线程安全的内存日志 handler，保留最近 maxlen 条记录。"""

    def __init__(self, maxlen: int = 500, level: int = logging.DEBUG):
        super().__init__(level)
        self._buffer: deque[LogRecord] = deque(maxlen=maxlen)
        self._lock = threading.Lock()

    def emit(self, record: logging.LogRecord):
        try:
            entry = LogRecord(record)
            with self._lock:
                self._buffer.append(entry)
        except Exception:
            self.handleError(record)

    def get_logs(
        self,
        levels: set[str] | None = None,
        search: str | None = None,
        limit: int = 200,
    ) -> list[dict]:
        with self._lock:
            items = list(self._buffer)
        # 倒序（最新在前）
        items.reverse()
        # 过滤
        if levels:
            items = [r for r in items if r.level in levels]
        if search:
            kw = search.lower()
            items = [r for r in items if kw in r.message.lower() or kw in r.logger_name.lower()]
        return [r.to_dict() for r in items[:limit]]

    def clear(self):
        with self._lock:
            self._buffer.clear()

    @property
    def count(self) -> int:
        return len(self._buffer)


# 全局单例
_handler: InMemoryLogHandler | None = None


def get_log_handler() -> InMemoryLogHandler:
    global _handler
    if _handler is None:
        _handler = InMemoryLogHandler(maxlen=500, level=logging.DEBUG)
    return _handler


def install_log_handler(app_logger: logging.Logger | None = None):
    """将 handler 挂载到 root logger，确保所有日志都被捕获。"""
    handler = get_log_handler()
    root = logging.getLogger()
    if handler not in root.handlers:
        root.addHandler(handler)
    # 确保 root logger 级别足够低
    if root.level > logging.DEBUG:
        root.setLevel(logging.DEBUG)
