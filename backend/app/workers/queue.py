# Background worker queue for pipeline generation jobs
# Executes tasks asynchronously without blocking API responses

import threading
import queue
import time
from typing import Callable, Any

class SimpleWorkerQueue:
    def __init__(self):
        self._queue = queue.Queue()
        self._thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._thread.start()

    def enqueue(self, task_func: Callable, *args, **kwargs):
        """Enqueue a background generation or rendering task."""
        self._queue.put((task_func, args, kwargs))

    def _worker_loop(self):
        while True:
            try:
                task_func, args, kwargs = self._queue.get()
                task_func(*args, **kwargs)
                self._queue.task_done()
            except Exception as e:
                print(f"[WorkerQueue] Background task error: {e}")
            time.sleep(0.1)

worker_queue = SimpleWorkerQueue()
