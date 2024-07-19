import datetime as dt
from typing import Any, TypeVar
import pytz

from apscheduler.schedulers.background import BackgroundScheduler


TIMER_TYPE = TypeVar("TIMER_TYPE", int, str)

class Timer:
    duration: int
    timer_id: int
    end_time: dt.datetime

    is_expired: bool

    def __init__(self, duration_in_seconds: int, timer_id: int):
        self.timer_id = timer_id
        self.duration = duration_in_seconds
        self.end_time = dt.datetime.now() + dt.timedelta(seconds=duration_in_seconds)

    @property
    def remaining_seconds (self):
        remaining_time = self.end_time - dt.datetime.now()
        return int(remaining_time.total_seconds())

    @remaining_seconds.setter
    def remaining_seconds(self, value: Any):
        raise AttributeError("Can't set remaining_seconds")

    @property
    def is_expired (self):
        return dt.datetime.now() >= self.end_time

    @is_expired.setter
    def is_expired (self, value: Any):
        raise AttributeError("Can't set is_expired")

    def run (self):
        ...

    def _run (self):
        print(f"Timer {self.timer_id} has expired")

        now = dt.datetime.now()

        self.end_time = now + dt.timedelta(seconds=self.duration)

        self.run()

class TimerManager:
    timers: dict[TIMER_TYPE, Timer]

    _total_timers: int

    def __init__(
        self, timers: dict[TIMER_TYPE, Timer] = None, paused_timers: dict[int, Timer] = None,
        scheduler: BackgroundScheduler = None
    ):
        self.timers = timers or {}
        self.paused_timers = paused_timers or {}
        self.scheduler = scheduler

        if scheduler is None:
            self.scheduler = BackgroundScheduler(timezone=pytz.utc)
            self.scheduler.add_job(self.check_timers, 'interval', seconds=1)

        self._total_timers = 0

    def add_timer (self, duration_in_seconds: int, timer_id: int = None):
        if timer_id is None:
            timer_id = self._total_timers

        if timer_id in self.timers:
            return "Timer ID already exists"

        self._total_timers += 1

        timer = Timer(duration_in_seconds, timer_id)
        self.timers[timer_id] = timer

        return timer_id, timer.end_time

    def get_timer (self, timer_id: int):
        if timer_id not in self.timers:
            return None, "Timer not found"

        timer = self.timers[timer_id]

        return timer.remaining_seconds, None

    def pause_timer (self, timer_id: int):
        if timer_id not in self.timers:
            return "Timer not found"

        self.paused_timers[timer_id] = self.timers[timer_id]
        del self.timers[timer_id]

        return None

    def check_timers (self):
        for timer in self.timers.values():
            if timer.is_expired:
                timer._run()

if __name__ == "__main__":
    timer_manager = TimerManager()
    timer_id, end_time = timer_manager.add_timer(10)
    timer_manager.scheduler.start()    

    while True:
        import time
        time.sleep(60)
        print("60 seconds has passed")